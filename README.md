hyperprox
---------

simple HTTP proxy based on [hyperquest](https://github.com/substack/hyperquest)

## install

```
$ npm install hyperproxy
```

## usage
Create a proxy by passing a function that will resolve what backend to use to the given request

```js
var http = require("http")
var hyperprox = require('hyperprox')

var proxy = hyperprox(function(req, next){
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
```

## api

#### `var proxy = hyperprox(function(req, next){})`

Create a new proxy by passing a function that will resolve the backend address and pass it to the 'next' function

## events

#### `proxy.on('request', function(req, res){})`

when a request arrives at the proxy

#### `proxy.on('route', function(req, address){})`

Once a routing decision has been made

## license

MIT