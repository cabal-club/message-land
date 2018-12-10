const path = require('path')
const budo = require('budo')
const express = require('express')
const compression = require('compression')
const hsts = require('hsts')
const periodicRestart = require('./periodicRestart')
const dbGateway = require('./dbGateway')

require('events').prototype._maxListeners = 100

process.chdir(path.resolve(__dirname, '..'))

const router = express.Router()

function serveIndex (req, res, next) {
  req.url = '/'
  next()
}

router.get('/', serveIndex)
router.get('/index.html', serveIndex)
router.get('/cabal/:key', serveIndex)

const attachWebsocket = dbGateway(router)

function runBudo () {
  const port = process.env.PORT || 5000
  const devServer = budo('client.js', {
    port,
    browserify: {
      transform: [
        'brfs',
        ['sheetify', { transform: ['sheetify-nested'] }]
      ]
    },
    middleware: [
      hsts({maxAge: 10886400}),
      compression(),
      // serviceWorkerNoCache,
      // redirectToHttps,
      // express.static('img'),
      router
    ]
    // dir: ['.data'],
    // staticOptions: {
    //   cacheControl: true,
    //   maxAge: 60 * 60 * 1000 // one hour
    // }
    /*
    stream: process.stdout,
    verbose: true
    */
  })
  devServer.on('connect', event => {
    console.log('Listening on', event.uri)
    attachWebsocket(event.server)
    periodicRestart(24 * 60) // Daily
  })
}

runBudo()
