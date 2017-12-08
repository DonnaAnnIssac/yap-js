let sock = new WebSocket('ws://localhost:8080')
let myId
let recipient = document.getElementById('recipient')
recipient.appendChild(document.createTextNode(''))
let messages = document.getElementById('messages')
let friendsList = document.getElementById('listFriends')

document.getElementById('save').onclick = () => {
  myId = document.getElementById('userName').value
  sock.send(JSON.stringify(myId))
}

document.getElementById('ping').onclick = () => {
  let msgObj = {}
  msgObj['to'] = recipient.textContent
  msgObj['from'] = myId
  msgObj['text'] = document.getElementById('text').value
  displayMessage(msgObj)
  sock.send(JSON.stringify(msgObj))
}

sock.onopen = (event) => {
  console.log('Websocket opened')
}

sock.onerror = (error) => {
  console.log('Web socket error: ' + error)
}

sock.onmessage = (event) => {
  let data = JSON.parse(event.data)
  if (typeof data === 'string') { // broadcast type msg
    let msg = data.slice(1, data.length - 1)
    displayMessage(msg)
  } else if (Array.isArray(data)) { // client list
    displayConnectedClients(data)
    addListenerToClient(friendsList)
  } else if (data.text === undefined) { // chat history
    displayChat(data)
  } else { // private message
    recipient.textContent = data.from
    displayChat(data)
  }
}

function createChildWithText (parent, text) {
  let dataDiv = document.createElement('div')
  dataDiv.appendChild(document.createTextNode(text))
  parent.appendChild(dataDiv)
}

function displayConnectedClients (friends) {
  friends.forEach((friend, i) => {
    if (!(friendsList.hasChildNodes()) || friendsList.childNodes.length - 1 < i) {
      createChildWithText(friendsList, friend.name)
    }
  })
}

function addListenerToClient (parent) {
  let children = parent.childNodes
  children.forEach((child) => {
    child.addEventListener('click', () => {
      recipient.textContent = child.textContent
      sock.send(JSON.stringify({'to': recipient.textContent, 'from': myId}))
    })
  })
}

function displayMessage (msg) {
  let textDiv = document.createElement('div')
  textDiv.className = 'msgs'
  textDiv.appendChild(document.createTextNode(msg.text))
  messages.appendChild(textDiv)
  if (msg.from === myId) textDiv.style.alignSelf = 'flex-end'
  else textDiv.style.alignSelf = 'flex-start'
}

function clearMsgBox () {
  while (messages.hasChildNodes()) messages.removeChild(messages.lastChild)
}

function displayChat (data) {
  clearMsgBox()
  if (data.history.length !== 0) {
    data.history.forEach((msg) => {
      if ((msg.to === myId && msg.from === recipient.textContent) || (msg.to === recipient.textContent && msg.from === myId)) {
        displayMessage(msg)
      }
    })
  }
}
