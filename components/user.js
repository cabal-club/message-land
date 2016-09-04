const html = require('choo/html')
const css = require('sheetify')
const marked = require('marked')

module.exports = (state, prev, send) => {
  const user = state.user
  const prefix = css`
    textarea {
      margin-top:3px;
      box-shadow: 0 0 5px #DDD inset;
      outline: none;
      transition: background 0.5s;
      transition: opacity 0.5s;
    }

    textarea:hover {
      opacity:0.85;
    }

    textarea:focus {
      background: white;
      opacity:1;
    }

    button {
      transition: all 0.3s;
    }

    .key {
      font-size:10px;
    }
  `

  return html`
    <div class="${prefix} mt3 user">
      <form onsubmit=${(e) => {
        const input = e.target.children[0]
        if (input.value) send('user:appendMessage', marked(input.value))
        input.value = ''
        e.preventDefault()
      }}>
        <textarea class="${prefix} pa2 b--light-gray br2 w-100 o-50 h4 bg-transparent hover-bg-near-white" id="message"></textarea>
        <button class="w-100 mv3 pv2 fw5 small-caps mid-gray br2 ba b--light-gray hover-bg-washed-green pointer bg-transparent" action="submit">Send Message</button>
      </form>
      <div class="${prefix} hide-child tc pv2 ba br2 b--light-gray b ph3 mb3 mid-gray">
        <div onclick=${copyKey} class="fw4 ttu tracked relative pointer">
          <h6 class="f6 ma0 pv1">Your Key</h6>
          <h6 class="f6 child absolute absolute--fill bg-washed-blue pv1 ma0">${user.keyCopied ? 'Key Added to Clipboard' : 'Click to copy'}</h6>
        </div>
        <div class="small-caps mv2 key tracked-tight code fw1 gray">${user.key}</div>
      </div>
    </div>
  `

  function copyKey (e) {
    e.preventDefault()
    var temp = html`<input></input>`
    document.body.appendChild(temp)
    temp.value = user.key
    temp.select()
    document.execCommand('copy')
    document.body.removeChild(temp)
    send('user:keyCopied')
    setTimeout(() => {
      send('user:keyCopied')
    }, 3000)
  }
}
