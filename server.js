const expressWebSocket = require('express-ws')
const websocketStream = require('websocket-stream/stream')
var wss = require('websocket-stream')
var pump = require('pump')
var Cabal = require('cabal-core')
var swarm = require('cabal-core/swarm')
var ram = require('random-access-memory')
var crypto = require('hypercore-crypto')
var http = require('http')
var path = require('path')

const budo = require('budo')
const express = require('express')
const compression = require('compression')
const hsts = require('hsts')
const mkdirp = require('mkdirp')

const cabals = {}
const router = express.Router()

function serveIndex (req, res, next) {
  req.url = '/'
  next()
}

router.get('/', serveIndex)
router.get('/index.html', serveIndex)
router.get('/cabal/:key', serveIndex)

runBudo()


function runBudo () {
  const port = process.env.PORT || 5000
  const devServer = budo('index.js', {
    port,
    browserify: {
      transform: [
        'brfs',
        ['sheetify', {transform: ['sheetify-nested']}]
      ]
    },
    middleware: [
      hsts({maxAge: 10886400}),
      compression(),
      // serviceWorkerNoCache,
      // redirectToHttps,
      express.static('img'),
      router
    ],
    dir: ['.', 'static', '.data'],
    staticOptions: {
      cacheControl: true,
      maxAge: 60 * 60 * 1000 // one hour
    }
    /*
    stream: process.stdout,
    verbose: true
    */
  })
  devServer.on('connect', event => {
    console.log('Listening on', event.uri)
    attachWebsocket(event.server)
    // periodicRestart(24 * 60) // Daily
  })
}

function attachWebsocket (server) {
  console.log('Attaching websocket')
  expressWebSocket(router, server, {
    perMessageDeflate: false
  })

  router.ws('/cabal/:key', (ws, req) => {
    const cabalKey = req.params.key
    console.log('Websocket initiated for', cabalKey)
    let cabal
    if (cabals[cabalKey]) {
      cabal = cabals[cabalKey].cabal
      cabals[cabalKey].lastAccess = Date.now()
    } else {
      cabal = Cabal(path.join('.data', cabalKey), cabalKey)
      cabals[cabalKey] = {
        cabal,
        lastAccess: Date.now(),
        clients: 0
      }
      cabal.on('peer-added', function (key) {
        console.log('peer added')
      })
      cabal.publishNick('msgland')
      // cabal.publish({
      //   type: 'chat/text',
      //   content: {
      //     channel: 'default',
      //     text: 'hello from the server'
      //   }
      // })
    }
    
    cabal.db.ready(() => {
      console.log('cabal ready')
      // Join swarm
      const sw = swarm(cabal)
      cabals[cabalKey].swarm = sw
      sw.on('connection', (peer, info) => {
        // console.log('Swarm connection', info)
      })
      const stream = websocketStream(ws)
      pump(
        stream,
        cabal.replicate(), // cabal is live: true and encryt: false by default
        stream,
        err => {
          if (err) console.log('error', err)
          console.log('pipe finished for ' + cabalKey, err && err.message)
        }
      )
    }) 
  })
}
