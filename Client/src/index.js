let sock = new WebSocket('ws://localhost:8080')
let myId
let friends = {}
let recipient = document.getElementById('recipient')
recipient.appendChild(document.createTextNode(''))
let messages = document.getElementById('messages')
let friendsList = document.getElementById('listFriends')

document.getElementById('save').onclick = () => {
  myId = document.getElementById('userName').value
  sock.send(JSON.stringify({'type': 'clientID', 'text': myId}))
}

document.getElementById('ping').onclick = () => {
  let msgObj = {}
  msgObj['type'] = 'pm'
  msgObj['to'] = recipient.textContent
  msgObj['from'] = myId
  msgObj['text'] = document.getElementById('text').value
  displayMessage(msgObj)
  document.getElementById('text').value = ''
  sock.send(JSON.stringify(msgObj))
}

document.getElementById('text').onclick = () => {
  document.getElementById('text').value = ''
}

sock.onopen = (event) => {
  console.log('Websocket opened')
}

sock.onerror = (error) => {
  console.log('Web socket error: ' + error)
}

sock.onmessage = (event) => {
  let message = JSON.parse(event.data)
  if (message.type === 'list') {
    displayConnectedClients(message.dataObj)
    addListenerToClient(friendsList)
  } else if (message.type === 'pm') {
    if (recipient.textContent !== message.from) notify(message)
    else displayMessage(message)
  } else if (message.type === 'history') {
    displayChat(message)
  } else if (message.type === 'broadcast') {
    recipient.textContent = message.from
    displayChat(message)
  } else if (message.type === 'closeConn') {
    handleClosedConn(message)
  }
}

function createChildWithText (parent, text) {
  let dataDiv = document.createElement('div')
  dataDiv.appendChild(document.createTextNode(text))
  parent.appendChild(dataDiv)
  friends[text] = false
}

function displayConnectedClients (friends) {
  friends.forEach((friend, i) => {
    if (friend !== myId &&
      ((friendsList.hasChildNodes() && friendsList.lastChild.innerHTML !== friend) ||
        !friendsList.hasChildNodes()) &&
      friendsList.childNodes.length - 1 < i) {
      createChildWithText(friendsList, friend)
    }
  })
}

function addListenerToClient (parent) {
  parent.childNodes.forEach((child) => {
    if (friends[child.textContent] === false) {
      friends[child.textContent] = true
      child.addEventListener('click', () => {
        recipient.textContent = child.textContent
        if (child.style.fontWeight === 'bolder') child.style.fontWeight = 'normal'
        sock.send(JSON.stringify({ 'type': 'history', 'to': recipient.textContent, 'from': myId }))
      })
    }
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

function notify (message) {
  friendsList.childNodes.forEach((friend) => {
    if (friend.textContent === message.from) {
      friend.style.fontWeight = 'bolder'
    }
  })
}

function handleClosedConn (message) {
  friendsList.childNodes.forEach((friend) => {
    if (friend.textContent === message.from) {
      friendsList.removeChild(friend)
    }
  })
}
