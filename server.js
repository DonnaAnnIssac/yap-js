const express = require('express')
const WebSocket = require('ws')
const http = require('http')
const app = express()
const server = http.createServer(app)
let webSockServer = new WebSocket.Server({server})

app.use(express.static('./public'))

webSockServer.clientTracking = true

let clients = {}
let clientList = []
let messages = []

webSockServer.on('connection', (socket, request) => {
  socket.on('message', (msg) => {
    handleMessages(msg, socket)
  })

  socket.on('close', () => {
    let msg = {}
    msg['type'] = 'closeConn'
    msg['from'] = clientList.filter((client) => {
      return clients[client]._ultron.id === socket._ultron.id
    })[0]
    webSockServer.broadcast(JSON.stringify(msg), socket._ultron.id)
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
    clientList.forEach((client) => { if (message.data === client) reopenConn(message, socket) })
    saveAndSendClientList(message, socket)
  } else if (message.type === 'pm' || message.type === 'file') {
    message['sent'] = true
    messages.push(message)
    sendPrivateMsg(message, retrieveHistory(message))
  } else if (message.type === 'history') {
    let history = retrieveHistory(message)
    socket.send(JSON.stringify({'type': 'history', 'to': message.to, 'from': message.from, 'history': history}))
  } else if (message.type === 'delivery-report') sendDeliveryReport(message)
  else if (message.type === 'broadcast') webSockServer.broadcast(JSON.stringify(message.data), socket._ultron.id)
}

webSockServer.broadcast = (msg, from) => {
  webSockServer.clients.forEach((client) => {
    if (client._ultron.id !== from) client.send(msg) // msg -> string
  })
}

function sendPrivateMsg (message, history) {
  clients[message.to].send(JSON.stringify({'type': message.type, 'to': message.to, 'from': message.from, 'data': message.data, 'history': history}))
  clients[message.from].send(JSON.stringify({'type': 'sent-report', 'from': message.from, 'to': message.to}))
}

function retrieveHistory (message) {
  return messages.filter((msgObj) => {
    return ((message.to === msgObj.to && message.from === msgObj.from) || (message.to === msgObj.from && message.from === msgObj.to))
  })
}

function saveAndSendClientList (message, socket) {
  clients[message.data] = socket
  clientList.push(message.data)
  webSockServer.broadcast(JSON.stringify({'type': 'list', 'dataObj': clientList}))
}

function reopenConn (message, socket) {
  clients[message.data] = socket
  webSockServer.broadcast(JSON.stringify({'type': 'reopenConn', 'from': message.data}), socket._ultron.id)
}

function sendDeliveryReport (message) {
  let i = messages.findIndex(obj => {
    return (message.from === obj.from && message.to === obj.to && message.data === obj.data)
  })
  messages[i]['delivered'] = true
  clients[message.from].send(JSON.stringify(message))
}
