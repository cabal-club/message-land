const html = require('choo/html')
const css = require('sheetify')

module.exports = (state, prev, send) => {
  const friends = state.friends
  const prefix = css`
    input {
      outline: none;
      box-shadow: none;
      transition: background 0.5s;
      transition: opacity 0.5s;
    }

    input:hover {
      opacity:0.95;
    }

    input:focus {
      background: white;
      opacity:1;
    }
  `

  return html`
    <div class="${prefix}">
      <form class="mr3" onsubmit=${(e) => {
        const input = e.target.children[0]
        send('friends:addFriend', input.value)
        input.value = ''
        e.preventDefault()
      }}>
        <input class="${prefix} w-100 pv2 ph2 ba br2 b--light-gray b o-70 bg-transparent hover-bg-near-white" autocomplete="off" placeholder="Add Friend's Key" id="friend-key"/>
      </form>
      <ul class="list pl0 ml0">
        ${friends.messages.map(function (status, i) {
          const contentWrapper = html`<div class="ph3 pv1"></div>`
          contentWrapper.innerHTML = status.data.message
          return html`
            <li class="bg-white mv2 ba b--light-silver br2" style="border-color:${friends.friends[status.key].color}">
              ${contentWrapper}
              <div class="pb2 ph1 gray f6 ma0 ttu tracked tr"><time>${new Date(status.data.timestamp).toISOString().replace(/z|t/gi,' ').trim()}</time></div>
            </li>
          `
        })}
      </ul>
    </div>
  `
}
