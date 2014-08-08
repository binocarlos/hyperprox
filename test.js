var fs = require('fs')
var path = require('path')
var hyperproxy = require('./')
var tape     = require('tape')
var http = require('http')
var url = require('url')
var through = require('through2')
var hyperquest = require('hyperquest')
var concat = require('concat-stream')

function runRequest(path, done){
  var req = hyperquest('http://127.0.0.1:8080' + path).pipe(concat(function(result){
    done(null, result.toString())
  }))
  req.on('error', done)
}

/*
tape('proxy the requests', function(t){

  var proxy = hyperproxy(function(req){
    if(req.url=='/c'){
      return null
    }
    var port = req.url=='/a' ? 8081 : 8082
    return 'http://127.0.0.1:' + port
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

        runRequest('/c', function(err, result){
          if(err){
            t.fail(err, 'b')
            t.end()
            return
          }
          t.equal(result, 'no backend found', 'no result ok')
          router.close()
          serverA.close()
          serverB.close()
          t.end()
        })
        
      })
    })
  }, 100)
})



tape('async router', function(t){

  var proxy = hyperproxy(function(req, next){

    setTimeout(function(){
      next(null, 'http://127.0.0.1:8081')
    }, 100)
    
  })

  var router = http.createServer(proxy.handler())
  var server = http.createServer(function(req, res){
    req.pipe(res)
  })

  router.listen(8080)
  server.listen(8081)

  function stopServers(){
    router.close()
    server.close()
  }

  setTimeout(function(){
    var req = hyperquest.post('http://127.0.0.1:8080/')
    var file = fs.createReadStream(path.join(__dirname, 'package.json'))

    file.pipe(req).pipe(concat(function(result){
      stopServers()
      t.equal(result.toString(), fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'), 'package.json read')
      t.end()
    }))
    req.on('error', function(err){
      stopServers()
      t.fail(err, 'error')
      t.end()
    })

  }, 100)
})
*/
tape('duplex mode', function(t){

  var backends = hyperproxy(function(req, next){

    setTimeout(function(){
      next(null, 'http://127.0.0.1:8081')
    }, 100)
    
  })

  var seen = {
    input:'',
    server:'',
    output:''
  }

  var router = http.createServer(function(req, res){
    var duplex = backends.duplex(req, res)

    var inputFilter = through(function(chunk, enc, next){
      chunk = chunk.toString()
      seen.input += chunk
      chunk = chunk.replace(/\"/g, 'DOUBLEQUOTE')
      this.push(chunk)
      next()
    })

    var outputFilter = through(function(chunk, enc, next){
      chunk = chunk.toString()
      seen.output += chunk
      chunk = chunk.replace(/TRIPLEQUOTE/g, '"')
      this.push(chunk)
      next()
    })

    req.pipe(inputFilter).pipe(duplex).pipe(outputFilter).pipe(res)
  })

  var server = http.createServer(function(req, res){
    req.pipe(through(function(chunk, enc, next){
      chunk = chunk.toString()
      seen.server += chunk
      chunk = chunk.replace(/DOUBLEQUOTE/g, 'TRIPLEQUOTE')
      this.push(chunk)
      next()
    })).pipe(res)
  })

  router.listen(8080)
  server.listen(8081)

  function stopServers(){
    router.close()
    server.close()
  }

  setTimeout(function(){
    var req = hyperquest.post('http://127.0.0.1:8080/')
    var file = fs.createReadStream(path.join(__dirname, 'package.json'))

    file.pipe(req).pipe(concat(function(result){

      var normal = result.toString()

      var doubleString = normal.replace(/\"/g, 'DOUBLEQUOTE')
      var tripleString = doubleString.replace(/DOUBLEQUOTE/g, 'TRIPLEQUOTE')

      t.equal(seen.input, normal, 'input string')
      t.equal(seen.server, doubleString, 'server string')
      t.equal(seen.output, tripleString, 'output string')

      stopServers()
      t.end()
    }))
    req.on('error', function(err){
      stopServers()
      t.fail(err, 'error')
      t.end()
    })

  }, 100)
})