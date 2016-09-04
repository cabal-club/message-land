const choo = require('choo')
const html = require('choo/html')
const css = require('sheetify')
const level = require('level-browserify')
const PeerStatus = require('peer-status-feed')

const user = require('./components/user')
const friends = require('./components/friends')

const db = level('./message-land', {valueEncoding: 'json'})
const userFeed = PeerStatus({db: db})

css('tachyons')
css('./style', {global: true})

const app = choo()
app.model({
  namespace: 'user',
  state: {
    messages: [],
    userInfo: {
      name: 'robot'
    }
  },
  reducers: {
    receiveMessage: (data, state) => ({ messages: [data].concat(state.messages) }),
    receiveKey: (data, state) => ({ loaded: true, key: data }),
    keyCopied: (data, state) => ({keyCopied: !(state.keyCopied)})
  },
  effects: {
    appendMessage: (data, state, send, done) => {
      const status = Object.assign({message: data, timestamp: new Date()}, state.userInfo)
      console.log(status)
      userFeed.appendStatus(status, () => {
        send('user:receiveMessage', status, done)
      })
    },
    initUser: (data, state, send, done) => {
      userFeed.open(function () {
        send('user:receiveKey', userFeed.key, () => {
          if (!userFeed.status) return done()
          console.info('user loaded', userFeed)
          send('user:receiveMessage', userFeed.status, done)
        })
        userFeed._swarm.on('connection', () => {
          console.info('swarm connection')
        })
      })
    }
  }
})
app.model({
  namespace: 'friends',
  state: {
    messages: [],
    friends: {}
  },
  reducers: {
    receiveMessage: (data, state) => ({ messages: [data].concat(state.messages) }),
    receiveFriend: (data, state) => {
      if (state.friends[data]) return {}
      const friends = state.friends
      const hue = (Object.keys(friends).length * 23) % 360 // TODO: best way to get colors
      friends[data] = {color: 'hsl(' + hue + ',90%, 40%)'}
      return {friends: friends}
    },
  },
  effects: {
    addFriend: (data, state, send, done) => {
      console.log('adding friend', data)
      userFeed.addPeer(data, done)
    }
  },
  subscriptions: [
    (send, done) => {
      userFeed.on('peer-data', function (status) {
        console.info('friend data', status)
        send('friends:receiveFriend', status.key, () => {
          send('friends:receiveMessage', status, done)
        })
      })
    }
  ]
})

const mainView = (state, prev, send) => {
  if (!state.user.loaded) send('user:initUser')
  return html`
    <main class="h-100 bg-washed-blue">
      <div class="cf">
        <header class="cf w-100 pa3 pb0">
          <h1 class="f5 mb0 fr w-25 fw4 pt3 bt bw1 ttu tracked mid-gray tr rh-title avenir">
            message.land
          </h1>
        </header>
        <section class="fl pa3 w-100 w-60-ns">
          ${state.user.loaded ? friends(state, prev, send) : ''}
        </section>
        <section class="fl mt4 pa3 w-100 w-40-ns">
          ${state.user.loaded ? user(state, prev, send) : ''}
        </section>
      </div>
    </main>
  `
}

app.router((route) => [
  route('/', mainView)
])

const tree = app.start()
document.body.appendChild(tree)
