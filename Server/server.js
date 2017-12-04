const Server = require('ws').Server
const sockServer = new Server({ port: 8080 })

sockServer.on('connection', (ws) => {
  ws.on('message', (msg) => {
    console.log('Received: ' + msg)
    ws.send(msg)
  })
})
