const http = require('http')
const path = require('path')
const bankai = require('bankai/http')
const express = require('express')
const compression = require('compression')
const hsts = require('hsts')
const mkdirp = require('mkdirp')
const periodicRestart = require('./periodicRestart')
const dbGateway = require('./dbGateway')

require('events').prototype._maxListeners = 100

process.chdir(path.resolve(__dirname, '..'))

// const router = express()
const port = process.env.PORT || 5000
const router = express.Router()
const compiler = bankai(path.join(__dirname, '..', 'index.js'))

const server = http.createServer(router)

function serveIndex (req, res, next) {
  console.log('request', req.url)
  req.url = '/'
  next()
}

// router.use(compiler)
router.use(hsts({maxAge: 10886400}))
router.use(compression())
// router.use(compiler)
// router.use(// serviceWorkerNoCache,
// router.use(// redirectToHttps,
router.use(express.static('dist'))
router.get('/', serveIndex)
router.get('/index.html', serveIndex)
router.get('/cabal/:key', serveIndex)
// router.get('/cabal/:key/:channel', serveIndex)

const attachWebsocket = dbGateway(router)

// attachWebsocket(server)
server.listen(port, () => console.log(`Example app listening on port ${port}!`))
// function runBudo () {
//   const devServer = budo('index.js', {
//     port,
//     browserify: {
//       transform: [
//         'brfs',
//         ['sheetify', {transform: ['sheetify-nested']}]
//       ]
//     },
//     middleware: [
//       hsts({maxAge: 10886400}),
//       compression(),
//       // serviceWorkerNoCache,
//       // redirectToHttps,
//       express.static('img'),
//       router
//     ],
//     dir: ['.', 'static', '.data'],
//     staticOptions: {
//       cacheControl: true,
//       maxAge: 60 * 60 * 1000 // one hour
//     }
//     /*
//     stream: process.stdout,
//     verbose: true
//     */
//   })
//   devServer.on('connect', event => {
//     console.log('Listening on', event.uri)
//     attachWebsocket(event.server)
//     periodicRestart(24 * 60) // Daily
//   })
// }
