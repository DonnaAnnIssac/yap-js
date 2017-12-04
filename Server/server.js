const express = require('express')
const WebSocket = require('ws')
const http = require('http')
const app = express()
const server = http.createServer(app)
let ws = new WebSocket.Server({server})
app.use(express.static('../Client'))

ws.on('connection', (connection, request) => {
  console.log('Connected')
  connection.on('message', (msg) => {
    console.log('Received: ' + msg)
    connection.send(msg)
          // group chat
    ws.clients.forEach((client) => {
      if (client !== ws) client.send(msg)
    })
  })
  connection.on('close', () => {
    console.log('Lost a client')
  })
  console.log('One more client connected')
})

ws.on('close', () => {
  console.log('Closing web socket')
})

server.listen(8080, () => {
  console.log('Example app listening on port 8080!')
})
