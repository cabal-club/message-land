const path = require('path')
const expressWebSocket = require('express-ws')
const websocketStream = require('websocket-stream/stream')
const pump = require('pump')
const Cabal = require('cabal-core')
const swarm = require('cabal-core/swarm')
// const ram = require('random-access-memory')

module.exports = dbGateway

const MAX_PEERS = 10 // p2p peer count
const MAX_CABALS = 20 // seem to get pretty slow with big chats?
const MAX_FEEDS = 128 // restrict chat size for now

const cabals = {}

setInterval(function cleanup () {
  const sortedCabals = Object.values(cabals).sort((a, b) => a.lastAccess - b.lastAccess)
  console.log('Oldest to newest gatewayed cabals:')
  sortedCabals.forEach((entry, index) => {
    const { cabal, lastAccess, clients } = entry
    const key = cabal.key && cabal.key.toString('hex')
    const feeds = cabal.db.feeds().length
    console.log(`  ${index} ${lastAccess} ${key} (${clients} clients, ${feeds} feeds)`) // , ${peers} peers)`)

    // Large chats seem to be breaking server =(
    // Temporarily removing them
    if (feeds.length > MAX_FEEDS) {
      console.log(`Releasing ${key} b/c of feed count`)
      cabal.cancel()
    }
  })
  if (sortedCabals.length > MAX_CABALS) {
    for (let i = 0; i < sortedCabals.length - MAX_CABALS; i++) {
      const cabal = sortedCabals[i].cabal
      const key = cabal.key && cabal.key.toString('hex')
      console.log(`Releasing ${i} ${key}`)
      sortedCabals[i].cancel()
    }
  }
}, 60 * 1000)

function dbGateway (router) {
  return function attachWebsocket (server) {
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
          cancel,
          lastAccess: Date.now(),
          clients: 0,
          peers: 0
        }
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
      // Join swarm
        const sw = swarm(cabal, { maxConnections: MAX_PEERS })
        cabals[cabalKey].swarm = sw

        cabals[cabalKey].clients += 1
        const stream = websocketStream(ws)
        cabals[cabalKey].stream = stream

        pump(
          stream,
          cabal.replicate(), // cabal is live: true and encryt: false by default
          stream,
          err => {
            console.log('pipe finished for ' + cabalKey, err && err.message)
            cabals[cabalKey].clients -= 1
          }
        )
      })

      function cancel () {
        console.log(`Cancelling ${cabalKey}`)
        const sw = cabals[cabalKey].swarm
        const stream = cabals[cabalKey].stream
        if (sw) sw.close()
        if (stream) stream.close()
        // cabal doesn't have close fn yet
        // cabal.db.source.peers.forEach(peer => peer.end()) // TODO ?
        delete cabals[cabalKey]
      }
    })
  }
}
