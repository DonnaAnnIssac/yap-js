let sock = new WebSocket('ws://localhost:8080')
let log = document.getElementById('log')
let friendsList = document.getElementById('listFriends')
let friends = []

sock.onopen = (event) => {
  console.log('Websocket opened')
}

sock.onerror = (error) => {
  console.log('Web socket error: ' + error)
}

sock.onmessage = (event) => {
  console.log('Message received from server')
  if (typeof JSON.parse(event.data) === 'string') {
    let msg = event.data.slice(1, event.data.length - 1)
    log = createChild(log, msg)
  } else dispplayConnectedClients(event.data)
}

document.getElementById('ping').onclick = () => {
  let text = document.getElementById('text').value
  // log.appendChild(document.createTextNode(text))
  sock.send(text)
}

function createChild (parent, text) {
  let dataDiv = document.createElement('div')
  dataDiv.appendChild(document.createTextNode(text))
  parent.appendChild(dataDiv)
  return parent
}

function dispplayConnectedClients (list) {
  friends = JSON.parse(list)
  friends.forEach((friend, i) => {
    if (!(friendsList.hasChildNodes()) || friendsList.childNodes.length - 1 < i) {
      friendsList = createChild(friendsList, friend)
    }
  })
}
