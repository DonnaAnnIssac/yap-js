const express = require('express')
const WebSocket = require('ws')
const http = require('http')
const app = express()
const server = http.createServer(app) // figure this out
let webSockServer = new WebSocket.Server({server})

app.use(express.static('./Client'))

webSockServer.clientTracking = true

webSockServer.broadcast = (msg, from) => {
  webSockServer.clients.forEach((client) => {
    if (client._ultron.id !== from) client.send(msg) // msg -> string
  })
}
let clients = []
let msgObj = {}

webSockServer.on('connection', (socket, request) => {
  clients.push(socket._ultron.id) // maintaining array of client ids
  socket.on('message', (msg) => {
    // console.log(JSON.parse(msg))
    handleMessages(msg, socket._ultron.id)
  })

  socket.on('close', () => {
    console.log('Lost a client')
  })
  console.log('One more client connected')
  socket.send(socket._ultron.id)
  webSockServer.broadcast(JSON.stringify(clients)) // broadcasting list of connected clients
})

webSockServer.on('close', () => {
  console.log('Closing web socket')
})

server.listen(8080, () => {
  console.log('Example app listening on port 8080!')
})

function handleMessages (msg, id) {
  let message = JSON.parse(msg)
  // console.log('Received: ' + message.text)
  if (message.to.length === 0) webSockServer.broadcast(JSON.stringify(message.text), id)
  else {
    for (let client of webSockServer.clients) {
      if (client._ultron.id === parseInt(message.to)) {
        msgObj['text'] = message.text
        msgObj['from'] = id
        client.send(JSON.stringify(msgObj))
        break
      }
    }
  }
}
