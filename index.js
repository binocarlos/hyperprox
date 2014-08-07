

var EventEmitter = require('events').EventEmitter
var hyperquest = require('hyperquest')
var util = require('util')

function HyperProxy(resolve){
	EventEmitter.call(this)
	if(!resolve){
		throw new Error('resolve function required')
	}

	this._resolve = resolve
	this._isAsync = resolve.length>=2
}

util.inherits(HyperProxy, EventEmitter)

HyperProxy.prototype.proxy = function(req, res, address){
	if(address.indexOf('http')!=0){
		address = 'http://' + address
	}
	var proxy = hyperquest(address + req.url, {
		method:req.method,
		headers:req.headers
	})
	if(req.method=='GET'||req.method=='DELETE'){
		proxy.pipe(res)
	}
	else{
		req.pipe(proxy).pipe(res)
	}
	proxy.on('error', function(err){
		res.statusCode = 500
		res.end(err.toString())
	})
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

HyperProxy.prototype.handler = function(){
	var self = this;
	return function(req, res){
		self.emit('request', req, res)
		self.resolve(req, function(err, address){
			if(err){
				res.statusCode = 500
				res.end(err)
				return
			}
			if(!address){
				res.statusCode = 404
				res.end('no backend found')
				return
			}
			self.emit('route', req, address)
			self.proxy(req, res, address)
		})
	}
}

module.exports = function(resolve){
	return new HyperProxy(resolve)
}