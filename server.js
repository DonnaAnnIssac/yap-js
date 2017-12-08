const express = require('express')
const WebSocket = require('ws')
const http = require('http')
const app = express()
const server = http.createServer(app)
let webSockServer = new WebSocket.Server({server})

app.use(express.static('./Client'))

webSockServer.clientTracking = true

let clients = []
let messages = []

webSockServer.on('connection', (socket, request) => {
  socket.on('message', (msg) => {
    handleMessages(msg, socket)
  })

  socket.on('close', () => {
    console.log('Lost a client')
  })
  console.log('One more client connected')
})

webSockServer.on('close', () => {
  console.log('Closing web socket')
})

server.listen(8080, () => {
  console.log('Example app listening on port 8080!')
})

function handleMessages (msg, socket) {
  let message = JSON.parse(msg)
  console.log('Received: ' + message)
  if (typeof message === 'string') { // in case of client id
    clients.push({'name': message, 'socket': socket._ultron.id})
    broadcast(JSON.stringify(clients)) // broadcasting list of connected clients
  } else if (message.to.length === 0) broadcast(JSON.stringify(message.text), socket._ultron.id) // in case of broadcast
  else if (message.text === undefined) { // in case of chat history
    let history = retrieveHistory(message)
    socket.send(JSON.stringify({'to': message.to, 'from': message.from, 'history': history}))
  } else { // in case of private message
    messages.push({'text': message.text, 'from': message.from, 'to': message.to})
    sendPrivateMsg(message)
  }
}

function broadcast (msg, from) {
  webSockServer.clients.forEach((client) => {
    if (client._ultron.id !== from) client.send(msg) // msg -> string
  })
}

function sendPrivateMsg (message) {
  let receiver = clients.filter((client) => { return client.name === message.to })[0]
  webSockServer.clients.forEach((client) => {
    if (client._ultron.id === receiver.socket) {
      client.send(JSON.stringify({'text': message.text, 'from': message.from, 'to': message.to}))
    }
  })
}

function retrieveHistory (message) {
  return messages.filter((msgObj) => {
    return ((message.to === msgObj.to && message.from === msgObj.from) || (message.to === msgObj.from && message.from === msgObj.to))
  })
}
