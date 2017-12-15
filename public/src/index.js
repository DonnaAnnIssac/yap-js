let sock = new WebSocket('ws://localhost:8080')
let myId, clickEvent
let fileBuff = {}
let friends = {}

let recipient = document.getElementById('recipient')
recipient.appendChild(document.createTextNode(''))

let messages = document.getElementById('messages')
let friendsList = document.getElementById('listFriends')
let fileInput = document.getElementById('fileIp')

document.getElementById('save').onclick = () => {
  myId = document.getElementById('userName').value
  sock.send(JSON.stringify({'type': 'clientID', 'data': myId}))
}

document.getElementById('ping').onclick = () => {
  if (clickEvent) {
    displayMessage(fileBuff)
    sock.send(JSON.stringify(fileBuff))
    clickEvent = false
  } else {
    let msgObj = createMsgObj('pm', document.getElementById('text').value)
    displayMessage(msgObj)
    document.getElementById('text').value = ''
    sock.send(JSON.stringify(msgObj))
  }
}

document.getElementById('text').onkeyup = (event) => {
  event.preventDefault()
  if (event.keyCode === 13) document.getElementById('ping').click()
}

function getTimeString () {
  let date = new Date()
  let hh = date.getHours()
  let mm = date.getMinutes()
  if (mm.toString().length === 1) mm = '0' + mm
  return hh + ':' + mm
}

function createMsgObj (type, data) {
  let msgObj = {}
  msgObj['type'] = type
  msgObj['to'] = recipient.textContent
  msgObj['from'] = myId
  msgObj['data'] = data
  msgObj['time'] = getTimeString()
  return msgObj
}

fileInput.onchange = () => {
  let file = fileInput.files[0]
  let fr = new FileReader()
  fr.onloadend = () => {
    let msgObj = createMsgObj('file', fr.result)
    clickEvent = true
    fileBuff = msgObj
  }
  fr.readAsDataURL(file)
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
  } else if (message.type === 'pm' || message.type === 'file') handleMessages(message)
  else if (message.type === 'history') displayChat(message)
  else if (message.type === 'closeConn') handleClosedConn(message)
  else if (message.type === 'reopenConn') handleReopenConn(message)
  else if (message.type === 'delivery-report' || message.type === 'sent-report') displayReportDiv()
  else if (message.type === 'broadcast') {
    recipient.textContent = message.from
    displayChat(message)
  }
}

function createChildWithText (parent, text) {
  let dataDiv = document.createElement('div')
  dataDiv.appendChild(document.createTextNode(text))
  dataDiv.style.width = '100%'
  dataDiv.style.color = '#fff'
  dataDiv.style.textAlign = 'center'
  dataDiv.style.verticalAlign = 'middle'
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
      child.addEventListener('click', () => onClientSelect(parent, child))
    }
  })
}

function onClientSelect (parent, child) {
  child.style.backgroundColor = '#263238'
  recipient.textContent = child.textContent
  recipient.style.flex = 4
  parent.childNodes.forEach((node) => {
    if (node !== child) node.style.backgroundColor = 'initial'
  })
  // document.getElementById('ping').disabled = false
  if (child.style.fontWeight === 'bolder') child.style.fontWeight = 'normal'
  // if (child.style.fontWeight === 'lighter') document.getElementById('ping').disabled = true
  sock.send(JSON.stringify({ 'type': 'history', 'to': recipient.textContent, 'from': myId }))
}

function handleMessages (message) {
  sock.send(JSON.stringify({'type': 'delivery-report', 'to': message.to, 'from': message.from, 'data': message.data}))
  if (recipient.textContent !== message.from) notify(message)
  else displayMessage(message)
}

function displayMessageBody (msg, div) {
  if (msg.type === 'file') {
    let [file, modal] = displayFileMsg(msg) // text or file
    div.appendChild(file)
    div.appendChild(modal)
  } else {
    let textDiv = document.createElement('div')
    textDiv.appendChild(document.createTextNode(msg.data))
    div.appendChild(textDiv)
  }
  return div
}

function addMessageStat (msg) {
  let statusDiv = document.createElement('div') // status
  statusDiv.className = 'status'
  let timeDiv = document.createElement('div') // time
  timeDiv.appendChild(document.createTextNode(msg.time))
  timeDiv.style.fontSize = '10'
  timeDiv.style.color = 'gray'
  timeDiv.style.textAlign = 'center'
  timeDiv.style.verticalAlign = 'middle'
  return [timeDiv, statusDiv]
}

function displayMessage (msg) {
  let msgDiv = document.createElement('div')
  msgDiv.className = (msg.from === myId) ? 'msgs-from-me' : 'msgs-to-me'
  msgDiv = displayMessageBody(msg, msgDiv)
  let stat = document.createElement('div')
  let [timeDiv, statusDiv] = addMessageStat(msg)
  stat.appendChild(timeDiv)
  stat.appendChild(statusDiv)
  msgDiv.appendChild(stat)
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

function displayReportDiv () {
  let elements = messages.getElementsByClassName('msgs-from-me')
  if (elements.length !== 0) {
    let status = elements.item(elements.length - 1).getElementsByClassName('status').item(0)
    status.style.display = 'flex'
    let sent = document.createElement('div')
    sent.style.background = 'url("../resources/check-mark.png") no-repeat'
    sent.style.backgroundSize = 'contain'
    sent.style.height = '10px'
    sent.style.flex = '1'
    sent.style.alignItems = 'right'
    status.appendChild(sent)
  }
}

function displayFile (modal, modalContent, msg) {
  modal.style.display = 'block'
  modalContent.src = msg.data
}

function displayFileMsg (msg) {
  let file = createFileThumb(msg)
  let modal = createEltWithClass('div', 'modal')
  let span = createEltWithClass('span', 'close')
  span.innerHTML = 'x'
  span.onclick = () => { modal.style.display = 'none' }
  let modalContent = createEltWithClass('img', 'modalContent')
  let downloadFile = document.createElement('a')
  downloadFile.href = msg.data
  downloadFile.download = 'download'
  downloadFile.appendChild(modalContent)
  modal.appendChild(span)
  modal.appendChild(downloadFile)
  file.onclick = () => displayFile(modal, modalContent, msg)
  return [file, modal]
}

function createFileThumb (msg) {
  let image = document.createElement('img')
  image.src = msg.data
  image.style.width = '100'
  image.className = 'thumbnail'
  return image
}

function createEltWithClass (tag, cName) {
  let elt = document.createElement(tag)
  elt.className = cName
  return elt
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
