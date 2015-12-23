hyperprox
---------

simple HTTP proxy based on [hyperquest](https://github.com/substack/hyperquest)

## install

```
$ npm install hyperprox
```

## usage
Create a proxy by passing a function that will resolve what backend to use to the given request

```js
var http = require("http")
var hyperprox = require('hyperprox')

var backends = hyperprox(function(req){
  // calculate the proxy destination
  var port = req.url=='/a' ? 8081 : 8082
  return 'http://127.0.0.1:' + port
})

// the front facing web server
var router = http.createServer(backends.handler())

backends.on('request', function(req, res){
	
})

backends.on('route', function(req, address){
	
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

## streams

We can generate a duplex stream for a request that will auto-route - this lets us filter the input and output:

```js
var through = require('through2')
var backends = hyperprox(function(req){
  var port = req.url=='/a' ? 8081 : 8082
  return 'http://127.0.0.1:' + port
})

var router = http.createServer(function(req, res){
	var proxy = backends.duplex(req, res)

	// filter the request body
	var inputFilter = through(function(chunk, enc, next){
		this.push(chunk.toString() + 'a')
		next()
	})

	// filter the response body
	var outputFilter = through(function(chunk, enc, next){
		this.push(chunk.toUpperCase())
		next()
	})

	// REQUEST -> INPUT FILTER -> PROXY -> OUTPUT FILTER -> RESPONSE
	req.pipe(inputFilter).pipe(proxy).pipe(outputFilter).pipe(res)
})
```

## async routing

Your routing function can be asynchronous - this means you can ask an external service for routing data:

If you define `next` in the parameters then it will be treated as an async router.

```js
var proxy = hyperprox(function(req, next){

	loadRoute(req.url, function(err, address){
		next(err, address)
	})
	
})
```

## api

#### `hyperprox.proxy(req, res, address, [input, output])`

A direct proxy function that will send req via address to res

Input and output are optional override streams to replace req and res

#### `var backends = hyperprox(function(req, next){})`

Create a new proxy by passing a function that will resolve the backend address and pass it to the 'next' function

#### `backends.handler()`

Return a `function(req,res){}` that will proxy requests using the routing function

#### `backends.proxy(req, res, address, [input, output])`

A direct proxy that will pipe req via address and to res

If input and output are provided - they will be used as the streams rather than req and res

#### `backends.resolve(req, done)`

The resolving function that goes via the user supplied function

#### `backends.duplex(req, res)`

Return a duplex stream going through the backend - you can write it to the original request / response how you want:

```js
var duplex = backends.duplex(req, res)
req.pipe(duplex).pipe(res)
```

If there is an error with routing the response will be set to 500 and the backend skipped

## events

#### `backends.on('request', function(req, res){})`

when a request arrives at the proxy

#### `backends.on('route', function(req, address){})`

Once a routing decision has been made

## license

MIT