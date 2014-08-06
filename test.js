var hyperproxy = require('./')
var tape     = require('tape')
var http = require('http')
var url = require('url')
var hyperquest = require('hyperquest')
var concat = require('concat-stream')

function runRequest(path, done){
  var req = hyperquest('http://127.0.0.1:8080' + path).pipe(concat(function(result){
    done(null, result.toString())
  }))
  req.on('error', done)
}

tape('proxy the requests', function(t){

  var proxy = hyperproxy(function(req, next){
    var port = req.url=='/a' ? 8081 : 8082
    next(null, 'http://127.0.0.1:' + port)
  })

  var router = http.createServer(proxy.handler())

  var reqs = {}
  var routes = {}

  proxy.on('request', function(req, res){
    reqs[req.url] = true
  })

  proxy.on('route', function(req, address){
    routes[req.url] = address
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

  setTimeout(function(){
    runRequest('/a', function(err, result){
      if(err){
        t.fail(err, 'a')
        t.end()
        return
      }
      t.equal(result, 'serverA')
      runRequest('/b', function(err, result){
        if(err){
          t.fail(err, 'b')
          t.end()
          return
        }
        t.equal(result, 'serverB')
        t.ok(reqs['/a'], 'req a')
        t.ok(reqs['/b'], 'req b')
        t.equal(routes['/a'], 'http://127.0.0.1:8081', 'route a')
        t.equal(routes['/b'], 'http://127.0.0.1:8082', 'route b')
        router.close()
        serverA.close()
        serverB.close()
        t.end()
      })
    })
  }, 100)
})