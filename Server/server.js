const express = require('express')
const WebSocket = require('ws')
const http = require('http')
const app = express()
const server = http.createServer(app) // figure this out
let webSockServer = new WebSocket.Server({server})

app.use(express.static('../Client'))

webSockServer.clientTracking = true

webSockServer.broadcast = (msg) => {
  webSockServer.clients.forEach((client) => {
    client.send(msg)
  })
}
let clients = []
let msgObj = {}
webSockServer.on('connection', (socket, request) => {
  clients.push(socket._ultron.id) // maintaining array of client ids
  socket.on('message', (msg) => {
    let message = JSON.parse(msg)
    console.log('Received: ' + message.text)
    if (message.id === undefined) webSockServer.broadcast(message.text)
    else {
      for (let client of webSockServer.clients) {
        if (client._ultron.id === parseInt(message.id)) {
          client.send(JSON.stringify(message.text))
          break
        }
      }
    }
  })

  socket.on('close', () => {
    console.log('Lost a client')
  })
  console.log('One more client connected')
  webSockServer.broadcast(JSON.stringify(clients)) // broadcasting list of connected clients
})

webSockServer.on('close', () => {
  console.log('Closing web socket')
})

server.listen(8080, () => {
  console.log('Example app listening on port 8080!')
})
