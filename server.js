const express = require('express')
const WebSocket = require('ws')
const http = require('http')
const app = express()
const server = http.createServer(app)
let webSockServer = new WebSocket.Server({server})

app.use(express.static('./Client'))

webSockServer.clientTracking = true

let clients = {}
let clientList = []
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
  console.log('Listening on port 8080')
})

function handleMessages (msg, socket) {
  let message = JSON.parse(msg)
  if (message.type === 'clientID') {
    saveAndSendClientList(message, socket)
  } else if (message.type === 'pm') {
    messages.push(message)
    sendPrivateMsg(message, retrieveHistory(message))
  } else if (message.type === 'history') {
    let history = retrieveHistory(message)
    socket.send(JSON.stringify({'type': 'history', 'to': message.to, 'from': message.from, 'history': history}))
  } else if (message.type === 'broadcast') webSockServer.broadcast(JSON.stringify(message.text), socket._ultron.id)
}

webSockServer.broadcast = (msg, from) => {
  webSockServer.clients.forEach((client) => {
    if (client._ultron.id !== from) client.send(msg) // msg -> string
  })
}

function sendPrivateMsg (message, history) {
  let receiver = clientList.filter((client) => { return client === message.to })[0]
  webSockServer.clients.forEach((client) => {
    if (client._ultron.id === clients[receiver]._ultron.id) {
      client.send(JSON.stringify({'type': 'pm', 'to': message.to, 'from': message.from, 'text': message.text, 'history': history}))
    }
  })
}

function retrieveHistory (message) {
  return messages.filter((msgObj) => {
    return ((message.to === msgObj.to && message.from === msgObj.from) || (message.to === msgObj.from && message.from === msgObj.to))
  })
}

function saveAndSendClientList (message, socket) {
  clients[message.text] = socket
  clientList.push(message.text)
  webSockServer.broadcast(JSON.stringify({'type': 'list', 'dataObj': clientList}))
}
