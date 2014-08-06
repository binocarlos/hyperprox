var http = require("http")
var hyperproxy = require('./')

var proxy = hyperproxy(function(req, next){
  // do some (maybe async) logic to
  // calculate the proxy destination
  var port = req.url=='/a' ? 8081 : 8082
  next(null, 'http://127.0.0.1:' + port)
})

// the front facing web server
var router = http.createServer(proxy)

var serverA = http.createServer(function(req, res){
  res.end('serverA')
})

var serverB = http.createServer(function(req, res){
  res.end('serverB')
})

router.listen(8080)
serverA.listen(8081)
serverB.listen(8082)