var EventEmitter = require('events').EventEmitter
var hyperquest = require('hyperquest')
var util = require('util')
var through = require('through2')
var duplexify = require('duplexify')

function HyperProxy(resolve){
	EventEmitter.call(this)
	if(!resolve){
		throw new Error('resolve function required')
	}

	this._resolve = resolve
	this._isAsync = resolve.length>=2
}

util.inherits(HyperProxy, EventEmitter)

function checkResolveErrors(res, err, address){
	if(err){
		res.statusCode = 500
		res.end(err)
		return false
	}
	if(!address){
		res.statusCode = 404
		res.end('no backend found')
		return false
	}
	return true
}

HyperProxy.prototype.proxy = function(req, res, address, input, output){
	if(address.indexOf('http')!=0){
		address = 'http://' + address
	}
	input = input || req
	output = output || res
	var proxy = hyperquest(address + req.url, {
		method:req.method,
		headers:req.headers
	})
	if(req.method=='GET'||req.method=='DELETE'){
		proxy.pipe(output)
	}
	else{
		input.pipe(proxy).pipe(output)
	}
	proxy.on('response', function(r){
		res.statusCode = r.statusCode
		res.headers = r.headers
	})
	proxy.on('error', function(err){
		res.statusCode = 500
		res.end(err.toString())
	})
	this.emit('proxy', req, res, address)
}

HyperProxy.prototype.resolve = function(req, done){
	var self = this;
	if(!this._isAsync){
		return done(null, this._resolve(req))
	}
	else{
		this._resolve(req, done)
	}
}

HyperProxy.prototype.duplex = function(req, res){
	var self = this;
	self.emit('request', req, res)

	var input = through()
	input.url = req.url
	input.method = req.method
	input.headers = req.headers || {}
	var output = through()

	self.resolve(req, function(err, address){
		if(!checkResolveErrors(res, err, address)) return
		self.emit('route', req, address)
		self.proxy(req, res, address, input, output)
	})

	return duplexify(input, output)
}

HyperProxy.prototype.handler = function(){
	var self = this;
	return function(req, res){
		self.emit('request', req, res)
		self.resolve(req, function(err, address){
			if(!checkResolveErrors(res, err, address)) return			
			self.emit('route', req, address)
			self.proxy(req, res, address)
		})
	}
}

module.exports = function(resolve){
	return new HyperProxy(resolve)
}