

var EventEmitter = require('events').EventEmitter
var hyperquest = require('hyperquest')
var util = require('util')

function HyperProxy(resolve){
	EventEmitter.call(this)
	if(!resolve){
		throw new Error('resolve function required')
	}
	this._resolve = resolve
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
		res.end(err)
	})
}

HyperProxy.prototype.handler = function(){
	var self = this;
	return function(req, res){
		self.emit('request', req, res)
		self._resolve(req, function(err, address){
			if(err){
				res.statusCode = 500
				res.end(err)
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