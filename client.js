const html = require('choo/html')
const choo = require('choo')
const css = require('sheetify')
const moment = require('moment')
const Autolinker = require('autolinker')
const strftime = require('strftime')
const debounce = require('lodash/debounce')
const logo = require('./elements/logo')
const sourceBtns = require('./components/footer')
const cabal = require('./cabal-web')

css('tachyons')
css('./style.css')

const app = choo()
if (process.env.NODE_ENV !== 'production') {
  app.use(require('choo-devtools')())
}
app.use(function (state, emitter) {
  emitter.emit(state.events.DOMTITLECHANGE, 'Welcome to message.land!')
  // state.key = '0b2a6c1c58014fe0da6dff38df6282157c405bc0ed7b550cda5c8c43d8067047'
})

app.use(state => {
  state.glitchAppName = 'message-land'
  state.gitHubRepoName = 'joehand/message-land'
})
app.use(cabal)
app.use(handleScroll)
app.use(updateTimestamps)
app.route('/', mainView)
app.route('/cabal/:key', mainView)
// app.route('/cabal/:key/:channel', mainView)
app.mount('body')

function mainView (state, emit) {
  const onScrollDebounced = debounce(onScroll, 50)

  const footer = html`
    <footer class="fixed w-100 bottom-0 ph3 pv2 ph4-m ph5-l bg-black">
      <nav class="flex code f5 ttl light-pink">
        <span class="center">cabal://${state.key}</span>
      </nav>
    </footer>
  `

  return html`
    <body class="courier" onscroll=${onScrollDebounced}>
      ${state.key && state.channel ? channel() : welcome()}
      ${state.key ? footer : ''}
    </body>
  `

  function welcome () {
    return html`
      <div class="">
        <div class="absolute w-100">
          <h1 class="f3"><span class="tr black w-50 fl">message   ·</span><span class="light-purple w-50 pl3">land</span></h1>
        </div>
        <div class="vh-100 dt w-50 fl bg-light-purple black">
          <div class="dtc v-mid tc ph3 ph4-l">
              ${newCabal()}
          </div>
        </div>
        <div class="vh-100 dt w-50 bg-black light-green">
          <div class="dtc v-mid tc ph3 ph4-l">
              ${cabalKey()}
          </div>
        </div>
        <footer class="absolute bottom-0">
          ${sourceBtns(state)}
        </footer>
      </div>
    `

    function newCabal () {
      return html`
        <div class="measure center">
          <button class="b f4 ttl center mb3 input-reset grow pointer bg-black light-green br4 ba b--light-green pv3 ph2 mb2 db w-75" onclick=${newCabal}>
            Create a Cabal!
          </button>
          <small id="key-desc" class="f2 b small-caps db near-black">Start a New Chat.</small>
        </div>
      `

      function newCabal (e) {
        emit('cabal:create')
      }
    }

    function cabalKey () {
      return html`
        <div class="measure center">
          <input id="key" class="f4 ttl bg-light-purple white center mb3 input-reset br4 ba b--light-green pv3 ph2 mb2 db w-75" type="text" aria-describedby="key-desc" 
            autofocus
            placeholder="cabal://..."
            onkeydown=${loadCabal} />
          <small id="key-desc" class="f2 b small-caps db">Join a Cabal!</small>
        </div>
      `

      function loadCabal (e) {
        const value = e.target.value
        if (e.keyCode === 13) {
          e.target.value = ''
          emit('cabal:load', value)
        }
      }
    }
  }

  function channel () {
    return html`
      <div class="mw-100 center">
        <div class="">
          <div class="fixed w-100 top-0 flex justify-between pa1 ph5-ns bb b--gold gold bg-navy">
            <div class="flex items-center f3">
              <span class="mr3">${state.channel}</span>
              <span class="gray f4">${state.topic}</span>
            </div>
            <p class="flex-grow flex items-center f4 gold ma0 lh-copy measure-wide">
              ${state.connected ? html`<span><span class="v-mid mr2 bg-light-blue dib pulse-circle"></span>connected</span>` : 'Connecting...'}
            </p>
          </div>
          <div class="pv6 bodoni dark-gray bg-near-white">
            ${state.messages.length || state.connected ? messages() : loading()}
          </div>
        </div>
        <div class="">
          ${chatBox()}
        </div>
      </div>
    `
  }

  function chatBox () {
    return html`
      <div class="w-100 bg-white fixed bottom-0 bt b--black  mb4 ph2 ph5-l">
        ${nickname()}
        <input class="${state.setNick ? 'absolute' : 'dn'} w-100 f4 pa2 ph5-ns pv4-ns input-reset bn b0" 
            placeholder="Set nickname" 
            ${state.setNick ? 'autofocus' : ''}
            value=${state.nickInput ? state.nickInput : ''}
            onkeydown=${handleNick} />
        <input class="w-100 f4 pa2 ph5-ns pv4-ns input-reset bn b0" 
            placeholder="Send a message..." 
            ${!state.setNick ? 'autofocus' : ''}
            value=${state.messageInput ? state.messageInput : ''}
            onkeydown=${handleInput} />
      </div>
    `

    function nickname () {
      if (state.setNick) return ''
      if (state.nickname) return html`<div class="absolute pv4-ns left-1 mw4 pr1 f4 dark-gray" onclick=${setNick}>${state.nickname}</a>`
      return html`
        <a class="absolute f6 link dim br2 ph2 mv4-ns dib white bg-navy pv1 left-0 top-0 ml1" onclick=${setNick}>Set Name</a>
      `
    }

    function setNick () {
      state.setNick = true
      emit('render')
    }

    function handleNick (e) {
      const value = e.target.value
      state.nickInput = value
      if (e.keyCode === 13) {
        state.nickInput = e.target.value = ''
        state.setNick = false
        emit('cabal:publishNick', value)
      }
    }

    function handleInput (e) {
      const value = e.target.value
      state.messageInput = value
      if (e.keyCode === 13) {
        state.messageInput = e.target.value = ''
        emit('cabal:publishMsg', value)
      }
    }
  }

  function messages () {
    return state.messages.map(msg => {
      const val = msg.value
      const msgEl = html`<p class="f5 mt2 lh-copy"></p>`
      msgEl.innerHTML = val.content.text

      return html`
        <div class="pa2 ph5-ns bb b--black-10">
          <div class="f6 mt3">
            <b class="mr2">${msg.key.slice(0, 8)}</b><span class="">${moment(val.timestamp).fromNow()}</span>
            <br><span class="f7 mid-gray">${msg.gitter ? 'via gitter  ' : ''}</span>
          </div>
          ${msgEl}
        </div>
      `
    })
  }

  function loading () {
    return html`
      <div class="pa2 ph5-ns bb b--black-10">
        <div class="f6 mt3 ttu tracked">
        </div>
        <p class="f5 mt2 lh-copy code">loading...</p>
        <p class="f5 i lh-copy red">Chat with lots of history may be slow to load!</p>
      </div>
    `
  }

  function onScroll (e) {
    if ((window.innerHeight + window.scrollY + 250) >= document.body.offsetHeight) {
      emit('scroll:bottom')
    } else {
      state.stickBottom = false
    }

    if ((window.scrollY - window.innerHeight + 250) < 0) {
      emit('scroll:top')
    }
  }
}

function updateTimestamps (state, emitter) {
  // render on inactivty to update timestamps
  let activityTimeout = setTimeout(inActive, 10000)
  emitter.on('render', function () {
    clearTimeout(activityTimeout)
    activityTimeout = setTimeout(inActive, 10000)
  })

  emitter.on('connected', function () {
    emitter.emit(state.events.DOMTITLECHANGE, 'Cabal ~~ ON-!')
    state.connected = true
    emitter.emit('render')
  })

  function inActive () {
    emitter.emit('render')
  }
}

function handleScroll (state, emitter) {
  emitter.on('scroll:top', function () {
    emitter.emit('cabal:backlog')
    //     state.startIndex = Math.max(state.startIndex - loadNum, 1)

    //     var stream = state.feed.createReadStream({live: false, start: state.startIndex, end: state.startIndex + loadNum})
    //     stream.on('data', function (data) {
    //       msgs.unshift(parseMessage(data))
    //     })
    //     stream.on('end', function () {
    //       state.messages = state.messages.concat(msgs)
    //       emitter.emit('render')
    //     })
  })

  emitter.on('scroll:bottom', function () {
    state.stickBottom = true
  })

  emitter.on('message', function () {
    // console.log(state.messages)
    emitter.emit('render')
    if (state.stickBottom || state.forceScroll) {
      setTimeout(function () {
        window.scrollTo(0, document.body.scrollHeight)
      }, 100)
    }
  })
}
