let sock = new WebSocket('ws://localhost:8080')
let friends = []
let recipient = document.getElementById('recipient')
recipient.appendChild(document.createTextNode(''))
let messages = document.getElementById('messages')
let friendsList = document.getElementById('listFriends')

document.getElementById('ping').onclick = () => {
  let msgObj = {}
  msgObj['text'] = document.getElementById('text').value
  messages.appendChild(document.createTextNode(msgObj['text']))
  msgObj['id'] = recipient.firstChild.textContent
  sock.send(JSON.stringify(msgObj))
  // sock.send(text)
}

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
    messages = createChildWithText(messages, msg)
  } else {
    displayConnectedClients(event.data)
    addListenerToClient(friendsList)
  }
}

function createChildWithText (parent, text) {
  let dataDiv = document.createElement('div')
  dataDiv.appendChild(document.createTextNode(text))
  parent.appendChild(dataDiv)
  return parent
}

function displayConnectedClients (list) {
  friends = JSON.parse(list)
  friends.forEach((friend, i) => {
    if (!(friendsList.hasChildNodes()) || friendsList.childNodes.length - 1 < i) {
      friendsList = createChildWithText(friendsList, friend)
    }
  })
}

function addListenerToClient (parent) {
  console.log('Adding listener')
  let children = parent.childNodes
  console.log(children)
  children.forEach((child) => {
    console.log('Trying')
    console.log(child.textContent)
    child.addEventListener('click', () => {
      recipient.textContent = child.textContent
    })
  })
}
