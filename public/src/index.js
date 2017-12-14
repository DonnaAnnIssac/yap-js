let sock = new WebSocket('ws://localhost:8080')
let myId
let friends = {}
let count = 0
let recipient = document.getElementById('recipient')
recipient.appendChild(document.createTextNode(''))

let messages = document.getElementById('messages')
let friendsList = document.getElementById('listFriends')
let fileInput = document.getElementById('fileIp')

fileInput.onchange = () => {
  let file = fileInput.files[0]
  let fr = new FileReader()
  fr.onloadend = () => {
    let msgObj = {}
    msgObj['type'] = 'file'
    msgObj['to'] = recipient.textContent
    msgObj['from'] = myId
    msgObj['data'] = fr.result
    sock.send(JSON.stringify(msgObj))
    displayMessage(msgObj)
  }
  fr.readAsDataURL(file)
}

document.getElementById('save').onclick = () => {
  myId = document.getElementById('userName').value
  sock.send(JSON.stringify({'type': 'clientID', 'data': myId}))
}

document.getElementById('ping').onclick = () => {
  let msgObj = {}
  msgObj['type'] = 'pm'
  msgObj['to'] = recipient.textContent
  msgObj['from'] = myId
  msgObj['data'] = document.getElementById('text').value
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
  } else if (message.type === 'pm') handleMessages(message)
  else if (message.type === 'history') displayChat(message)
  else if (message.type === 'closeConn') handleClosedConn(message)
  else if (message.type === 'reopenConn') handleReopenConn(message)
  else if (message.type === 'delivery-report') displayReportDiv()
  else if (message.type === 'sent-report') displayReportDiv()
  else if (message.type === 'file') handleMessages(message)
  else if (message.type === 'broadcast') {
    recipient.textContent = message.from
    displayChat(message)
  }
}

function handleMessages (message) {
  sock.send(JSON.stringify({'type': 'delivery-report', 'to': message.to, 'from': message.from, 'data': message.data}))
  if (recipient.textContent !== message.from) notify(message)
  else displayMessage(message)
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
        count = 0
        recipient.textContent = child.textContent
        document.getElementById('ping').disabled = false
        if (child.style.fontWeight === 'bolder') child.style.fontWeight = 'normal'
        if (child.style.fontWeight === 'lighter') document.getElementById('ping').disabled = true
        sock.send(JSON.stringify({ 'type': 'history', 'to': recipient.textContent, 'from': myId }))
      })
    }
  })
}

function displayMessage (msg) {
  let msgDiv = document.createElement('div')
  msgDiv.className = (msg.from === myId) ? 'msgs-from-me' : 'msgs-to-me'
  if (msg.type === 'file') {
    let image = document.createElement('img')
    image.src = msg.data
    image.style.width = '100'
    msgDiv.appendChild(image)
  } else msgDiv.appendChild(document.createTextNode(msg.data))
  let statusDiv = document.createElement('div')
  statusDiv.className = 'status'
  msgDiv.appendChild(statusDiv)
  messages.appendChild(msgDiv)
  msgDiv.style.display = 'flex'
  msgDiv.style.flexDirection = 'column'
  msgDiv.style.alignSelf = (msg.from === myId) ? 'flex-end' : 'flex-start'
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
        if (msg.from === myId && msg.sent) displayReportDiv()
        if (msg.from === myId && msg.delivered) displayReportDiv()
      }
    })
  }
}

function notify (message) {
  friendsList.childNodes.forEach((friend) => {
    if (friend.textContent === message.from) {
      friend.style.fontWeight = 'bolder'
      count++
    }
  })
  return count
}

function handleClosedConn (message) {
  friendsList.childNodes.forEach((friend) => {
    if (friend.textContent === message.from) {
      friend.style.fontWeight = 'lighter'
    }
  })
}

function handleReopenConn (message) {
  friendsList.childNodes.forEach((friend) => {
    if (friend.textContent === message.from) {
      friend.style.fontWeight = 'normal'
    }
  })
}

function displayReportDiv () {
  let elements = messages.getElementsByClassName('msgs-from-me')
  if (elements.length !== 0) {
    let status = elements.item(elements.length - 1).getElementsByClassName('status').item(0)
    status.style.display = 'flex'
    let sent = document.createElement('div')
    sent.style.background = 'url("../resources/check-mark.png") no-repeat'
    sent.style.backgroundSize = 'contain'
    sent.style.height = '4%'
    sent.style.flex = '1'
    sent.style.alignItems = 'right'
    status.appendChild(sent)
  }
}
