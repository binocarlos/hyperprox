var http = require("http")
var hyperprox = require('./')

var proxy = hyperprox(function(req, next){
  // do some (maybe async) logic to
  // calculate the proxy destination
  var port = req.url=='/a' ? 8081 : 8082
  return 'http://127.0.0.1:' + port
})

// the front facing web server
var router = http.createServer(proxy.handler())

proxy.on('request', function(req, res){

})

proxy.on('route', function(req, address){
	
})

var serverA = http.createServer(function(req, res){
  res.end('serverA')
})

var serverB = http.createServer(function(req, res){
  res.end('serverB')
})

router.listen(8080)
serverA.listen(8081)
serverB.listen(8082)