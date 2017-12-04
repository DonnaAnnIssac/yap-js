let sock = new WebSocket('ws://localhost:8080')
sock.onopen = (event) => {
  console.log('Websocket opened')
}
sock.onerror = (error) => {
  console.log('Web socket error: ' + error)
}
sock.onmessage = (event) => {
  console.log('Message received from server')
  console.log(event.data)
}
document.getElementById('ping').onclick = () => {
  let text = document.getElementById('text').value
  let log = document.getElementById('log')
  log.appendChild(document.createTextNode(text))
  sock.send(text)
}
