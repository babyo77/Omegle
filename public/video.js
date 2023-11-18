let socket = io()
let peer = new Peer({
    secure: true,
  });
let YourID;
peer.on('open',id=>{
    YourID = id
    console.log('YOUR ID',YourID)
})

let connectionstatus = document.getElementById('connection-status')
let Chat = document.getElementById('chat')
let ChatDiv = document.getElementById('ChatDiv')
let messageInput = document.getElementById('message')
let stranger = document.getElementById('stranger')
let You = document.getElementById('you')
let paired = false

socket.on('connect', () => {
    connectionstatus.classList = []
    color('')
    connectionstatus.textContent = "Finding Partner 🔎"
    
})

function color(ok) {
    connectionstatus.classList.remove('text-red-500', 'text-green-500');
    if (ok) {
        connectionstatus.classList.add('text-red-500')
    } else {
        connectionstatus.classList.add('text-green-500')
    }

}

function findNextRoom() {
   stranger.srcObject = null
   stranger.muted = true
    paired = false
    socket.emit('next')
    console.log('next')
}

let nextcall = true
socket.on('paired', (msg) => {
    color('')
    connectionstatus.textContent = msg
    paired = true
    Chat.innerHTML = ''
    if(!nextcall){
            socket.emit('calling',YourID)
            nextcall = true
    }else{
        socket.emit('calling',YourID)
          console.log('next call')
    }
})


window.onbeforeunload = () => {
    socket.emit('message', 'Disconnected ❗')
    Chat.innerHTML=''
}

socket.on('pairing', (msg) => {
    connectionstatus.textContent = msg
    Chat.innerHTML = ''
    paired = false
})

function createMessage(from, message,id) {
    const msg = document.createElement('p')
    msg.textContent = `${from}: ${message}`
    msg.id = id || 'message'
    if (message == 'Disconnected❗') {
        msg.textContent = message
        paired = false
    }else if(from == 'Stranger'){
        msg.classList.add('text-red-500')
    }
    Chat.append(msg)
    scrollToBottom()
}

socket.on('message:recieved', (msg) => {
    paired = true
    if(paired && connectionstatus.textContent == 'Chat Disconnected❗' ){
        Chat.innerHTML=''
       connectionstatus.textContent = 'Partner Found 🦄 - Chat Connected'
    }
    const typing =  document.querySelectorAll('#typing')
    typing.forEach(typingMSG=>{
        if(typing){

            typing.forEach(msg=>{
                typingMSG.remove()
            })  
        }
    })
    color('')
    if (msg == 'Stranger left The Chat' || msg == 'Disconnected ❗') {
        connectionstatus.textContent = 'Chat Disconnected❗'
        color('ok')
        createMessage('Stranger', 'Stranger left The Chat')
        stranger.srcObject = null
        stranger.muted = true
        paired = false
        scrollToBottom()
    } else {
        createMessage('Stranger', msg)
        scrollToBottom()
    }
   
})

function sendMessage() {
    if(messageInput.value=='Disconnected ❗' || messageInput.value == 'Stranger left The Chat'){
        return
    }
    if (messageInput.value.trim() && paired === true){
        socket.emit('message', messageInput.value)
    createMessage('You', messageInput.value)
    messageInput.value=""
    scrollToBottom()
    }
    
}

messageInput.addEventListener('keydown',(e)=>{
    if(e.key=='Enter'){
        sendMessage()
    }
})

document.addEventListener('keydown',(e)=>{
    if(e.key=='Escape'){
        findNextRoom()
    }
})

let TypinStatus = false

messageInput.addEventListener('input',()=>{
    if(!TypinStatus){
        TypinStatus = true
        socket.emit('typing')
        scrollToBottom()
    }

   setTimeout(() => {
    TypinStatus =  false
        const typing =  document.querySelectorAll('#typing')
        typing.forEach(msg=>{
            if(typing){

                typing.forEach(msg=>{
                    msg.remove()
                })  
            }
        })  
    }, 1300);

})

socket.on('typing',()=>{
    if(!TypinStatus){
        createMessage('Stranger','Typing..','typing')
        TypinStatus = true
        scrollToBottom()
    }

  setTimeout(() => {
        TypinStatus=false
        const typing =  document.querySelectorAll('#typing')
        if(typing){

            typing.forEach(msg=>{
                msg.remove()
            })  
        }
    }, 1300);
})


function scrollToBottom(){
    ChatDiv.scrollTop = ChatDiv.scrollHeight;
}

// video call PeerJS
let localStream;

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        You.srcObject = stream
        localStream = stream
    })
    .catch((error) => {
        console.error('Error accessing media devices:', error);
    });

    peer.on('call', (call) => {
        call.answer(localStream);
        call.on('stream', (stream) => {
          stranger.srcObject = stream;
        });
    });
    
    
    let RemoteID;
    socket.on('call-Accepted',id=>{
        RemoteID = id
        console.log('incoming call',id)
        makeCall()
      })


      function makeCall(){
            const call = peer.call(RemoteID, localStream);
            call.on('stream', (stream) => {
                stranger.srcObject = stream;
                stranger.muted = false
                console.log('call accepted from',RemoteID)
              });

    }
    


