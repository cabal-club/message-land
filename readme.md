# message.land

send messages to friends.

WIP - message.land not working right now b/c of a peer discovery issue (!?).

## About

give your friends your special key. post a message. the message will be sent to any online friends that added your key.

* your messages are only sent to people online when you send them (all messages send are stored in browser database).
* messages can be any length and are formatted using markdown.
* anyone offline when you send message will not get the message (friends do not re-upload your messages).
* when you revisit site you'll see the last message you got before closing message.land (all messages received are store in browser database).
* all local send messages, friends, and friend messages can be removed by deleting browser cache (or just indexdb). but your friends may still have your messages in their browser database (by default they won't upload them, though it is possible for them to).

You may think this is kind of a weird communication system, I'd agree. I am curious as to if (how) this is useful. Kind of ephemeral but not really. Send a PR or open an issue if you have a interesting use case! We can add it to the readme.

## TODOs

* add welcome/usage guide as first friend message by default (doesn't need to be in hypercore, just choo model).
* show user's messages. right now, you can add yourself as hack to see your messages.
* set user names, other metadata to add on all messages.
* one swarm per instance with many keys (currently many swarms)
* turn these TODOs into issues

## Usage

Go to [message.land](http://message.land) and send messages to the land.

## Development

Build with [Dat](http://dat-data.com), [Choo](http://github.com/).

### Run Site Locally

```
git clone git@github.com:joehand/message-land.git && cd message-land
npm install
npm start
```

You should be able to connect to message.land users (!?).

### Build & Deploy

* `npm run build` to build and deploy via `gh-pages`

## License

MIT