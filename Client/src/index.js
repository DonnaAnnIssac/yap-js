let sock = new WebSocket('ws://localhost:8080')
let friends = []
let from, to
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
  msgObj['text'] = document.getElementById('text').value
  msgObj['to'] = (from === undefined) ? recipient.textContent : from
  msgObj['from'] = myId
  messages.appendChild(document.createTextNode(msgObj['text']))
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
    displayChat(msg)
  } else if (Array.isArray(data)) { // client list
    displayConnectedClients(event.data)
    addListenerToClient(friendsList)
  } else if (data.history !== undefined) {
    let chatHistory = data.history
    let children = document.getElementsByClassName('msgs')
    for (let i = 0; i < children.length; i++) messages.removeChild(children[i])
    if (chatHistory.length !== 0) {
      chatHistory.forEach((msg) => {
        if ((msg.to === myId && msg.from === recipient.textContent) || (msg.to === recipient.textContent && msg.from === myId))
          displayChat(msg)
      })
    }
  } else { // private message
    displayChat(data)
    from = data.from
    recipient.textContent = from
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
      friendsList = createChildWithText(friendsList, friend.name
      )
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

function displayChat (msg) {
  let textDiv = document.createElement('div')
  textDiv.className = 'msgs'
  textDiv.appendChild(document.createTextNode(msg.text))
  messages.appendChild(textDiv)
  if (msg.from === myId) textDiv.style.alignSelf = 'flex-end'
  else textDiv.style.alignSelf = 'flex-start'
}
