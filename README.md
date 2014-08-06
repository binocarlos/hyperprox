hyperproxy
----------

simple HTTP proxy based on [hyperquest](https://github.com/substack/hyperquest)

## install

```
$ npm install hyperproxy
```

## usage
Create a proxy by passing a function that will resolve what backend to use to the given request

```js
var http = require("http")
var hyperProxy = require('hyperproxy')

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
```

## api

### `var proxy = hyperproxy(function(req, next){})`

Create a new proxy by passing a function that will resolve the backend address and pass it to the 'next' function

## license

MIT