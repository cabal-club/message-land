const wss = require('websocket-stream')
const Cabal = require('cabal-core')
const pump = require('pump')
const rai = require('random-access-idb')
const crypto = require('hypercore-crypto')
const collect = require('collect-stream')

module.exports = connectCabal

function connectCabal (state, emitter) {
  
  emitter.once(state.events.DOMCONTENTLOADED, function () {
   if (state.params && state.params.key) {
     emitter.emit('cabal:load', state.params.key)
   }
  })
  
  emitter.on('cabal:load', function (key) {
    if (key.indexOf('cabal:') > -1) key = key.split('//')[1] // todo: be less lazy =)
    emitter.emit('log:info', `loading new cabal ${key}`)
    
    const host = document.location.host
    const proto = document.location.protocol === 'https:' ? 'wss' : 'ws'
    const wsUrl = `${proto}://${host}/cabal/${key}`

    state = Object.assign(state, {
      channel: 'default',
      key: key,
      cabal: null,
      messages: [],
      connected: false,
      wsUrl: wsUrl,
      forceScroll: true
    })
    
    if (!state.cabal) createCabal()
    emitter.emit('render')
  })
  
  emitter.on('cabal:create', function () {
    state.newCabal = true
    emitter.emit('cabal:load', crypto.keyPair().publicKey.toString('hex'))
  })
  
  emitter.on('cabal:publishMsg', function (msg) {
    emitter.emit('log:info', `publishing new message to ${state.channel}`)
    state.cabal.publish({
      type: 'chat/text',
      content: {
        channel: state.channel,
        text: msg
      }
    })
  })
  
  emitter.on('cabal:publishNick', function (name) {
    emitter.emit('log:info', `publishing new name: ${name}`)
    state.nickname = name
    state.cabal.publishNick(name)
    emitter.emit('render')
  })
  
  emitter.once('cabal:backlog', function () {
    // TODO make this work?
//     const opts = {limit: 3, lt: state.messages[0].value.timestamp }
//     var rs = state.cabal.messages.read('default', opts)
//     collect(rs, function (err, msgs) {
//       if (err) return
      
//       // msgs.reverse()
//       msgs.forEach(function (msg) {
//         state.messages.unshift(msg)
//         console.log(msg.value.timestamp)
//       })
//       emitter.emit('message')
//     })
  })
  
  function createCabal () {
    const storage = rai(`doc-${state.key}`)
    var cabal = Cabal(storage, state.key)
    let cabalStream
    let retries = 0

    cabal.db.ready(function () {
      state.cabal = cabal
      emitter.emit('log:info', 'cabal ready')
      emitter.emit('log:info', cabal.key.toString('hex'))
      
      if (state.newCabal) {
        cabal.publish({
          type: 'chat/text',
          content: {
            channel: 'default',
            text: 'Welcome to your new Cabal! Share the link at the bottom to start chatting.'
          }
        }, replicate)
      } else {
        replicate()  
      }
      
      if (!state.params.key) emitter.emit(state.events.PUSHSTATE, `cabal/${state.key}`)
      emitter.emit('render')
    })
    

    function replicate () {
      retries++
      emitter.emit('log:info', 'starting websocket', state.wsUrl)
      
      const stream = wss(state.wsUrl)
      cabalStream = cabal.replicate({live: true, encrypt: false})
      
      stream.once('connect', function () {
        emitter.emit('connected')
        emitter.emit('render')
        emitter.emit('log:info', 'websockets connected')
        getMessages()
      })
      
      pump(
        stream,
        cabalStream,
        stream,
        err => {
          state.connected = false
  
          if (err) {
            console.log('Pipe finished', err.message)
            if (err.stack) {
              console.log(err.stack)
            }
          } else {
            console.log('Pipe finished, no errors')
          }
          if (retries > 1) {
            // first connection isn't getting messages sometimes/?!?!
            emitter.emit('log:warn', 'Waiting 3 seconds to reconnect')
            setTimeout(replicate, 3000)
          } else {
            replicate()
          }
        }
      )
    }
  }
  
  function getMessages () {
    console.log('start getting cabal msgs yay')
    if (!state.messages) state.messages = []
    
    var pending = 0
    function onMessage () {
      if (pending > 0) {
        pending++
        return
      }
      pending = 1
    
      // From cabal CLI =)
      // TODO: wrap this up in a nice interface and expose it via cabal-client 
      var rs = state.cabal.messages.read('default', {limit: 25, lt: '~'})
      collect(rs, function (err, msgs) {
        if (err) return
        
        state.messages = []
        msgs.reverse()
        msgs.forEach(function (msg) {
          state.messages.push(msg)
        })
        emitter.emit('message')

        state.cabal.topics.get('default', (err, topic) => {
          if (err) return
          if (topic) {
            state.topic = topic
            emitter.emit('render')
          }
        })

        if (pending > 1) {
          pending = 0
          onMessage()
        } else {
          pending = 0
        }
      })
    }

    state.cabal.messages.events.on('default', onMessage)
    onMessage()
  }
}
