const html = require('choo/html')
const css = require('sheetify')
const GitHubButton = require('./ghButton')

// from https://glitch.com/edit/#!/dat-shopping-list?path=components/footer.js:54:0

const prefix = css`
  :host {
    display: flex;
    flex-wrap: wrap;
    align-items: center;

    & > * {
      margin: 0.1rem;
    }

    & > a {
      margin-right: 0.2rem;
    }

    #more {
      justify-self: end;
      width: 7rem;
      margin-left: auto;
    }

    .github-button {
      opacity: 0;
    }
  }
`

module.exports = footer

function footer (state) {
  const { glitchAppName, gitHubRepoName } = state
  const ghButton = state.cache(GitHubButton, 'gitHubButton', gitHubRepoName).render()
  return html`
    <footer class=${prefix}>
      <a class="grow" href="https://glitch.com/edit/#!/${glitchAppName}">
        <img src="https://cdn.glitch.com/2bdfb3f8-05ef-4035-a06e-2043962a3a13%2Fview-source%402x.png?1513093958802"
              alt="view source button" aria-label="view source" height="33">
      </a>
      <a class="grow"  href="https://glitch.com/edit/#!/remix/${glitchAppName}">
        <img src="https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg"
              alt="Remix on Glitch" />
      </a>
      ${ghButton}
    </footer>
  `
}
