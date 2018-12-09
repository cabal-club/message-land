// Restart after an interval so that the demo doesn't seed content forever
// Active clients should re-connect

// source: https://glitch.com/edit/#!/dat-shopping-list?path=server/periodicRestart.js:12:0

module.exports = periodicRestart

function periodicRestart (intervalMinutes) {
  setTimeout(() => {
    console.log(`Planned periodic restart after ${intervalMinutes} minutes.`)
    process.exit(0)
  }, intervalMinutes * 60 * 1000)
}
