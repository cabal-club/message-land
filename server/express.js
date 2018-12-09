const http = require('http')
const path = require('path')
const bankai = require('bankai/http')
const express = require('express')
const compression = require('compression')
const hsts = require('hsts')
const periodicRestart = require('./periodicRestart')
const dbGateway = require('./dbGateway')

const port = process.env.PORT || 5000
const app = express()
const router = express.Router()
const attachWebsocket = dbGateway(router)

function serveIndex (req, res, next) {
  req.url = '/'
  next()
}

app.use(hsts({maxAge: 10886400}))
app.use(compression())
app.use(router)
app.get('/', serveIndex)
app.get('/index.html', serveIndex)
app.get('/cabal/:key', serveIndex)
app.use(express.static(path.join(__dirname, '..', 'dist')))
app.get('*', (req, res) => res.redirect('/'))

const server = http.createServer(app)
server.on('listening', () => {
  console.log(`Application started on port ${port}`)
  attachWebsocket(server)
  periodicRestart(24 * 60) // Daily
})

server.listen(port)
