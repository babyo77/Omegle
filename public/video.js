let connectVerify = false
let socket;
if(localStorage.getItem('ok')=='ok'){
  connectVerify  = true
}else{
    window.location.href = '/index.html'
}
if(connectVerify){
    socket = io()
}
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
    if(peerConnection){
        hangup()
        socket.emit('hangup')
    }
    paired = false
    socket.emit('next')
    console.log('next')
}


socket.on('paired', (msg) => {
    color('')
    connectionstatus.textContent = msg
    paired = true
    Chat.innerHTML = ''
makeCall()
})


window.onbeforeunload = () => {
    Chat.innerHTML=''
    if(peerConnection){
        hangup()
        socket.emit('hangup')
    }
    socket.emit('message', 'Disconnected ❗')
}

socket.on('pairing', (msg) => {
    if(peerConnection){
        hangup()
        socket.emit('hangup')
    }
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

// webRTC video call Feature

const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const peerConnection = new RTCPeerConnection(configuration);
let localStream
const constraints = {
    'video': true,
    'audio': true
}
navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        localStream = stream
         You.srcObject = localStream
    })
    .catch(error => {
        console.error('Error accessing media devices.', error);
    });

    async function makeCall() {
        console.log('calling')
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
        
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer',offer);
        console.log('sending offer')
    }
    
 
socket.on('offer', async message => {
    if (message) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(message));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer',answer);
        console.log('r3c offer')
    }
});

socket.on('answer', async message => {
    if (message) {
        const remoteDesc = new RTCSessionDescription(message);
        await peerConnection.setRemoteDescription(remoteDesc);
        console.log('receiving answer')
    }
});


// Listen for local ICE candidates on the local RTCPeerConnection
peerConnection.addEventListener('icecandidate', event => {
    if (event.candidate) {
        socket.emit('icecandidate', event.candidate);
        console.log('ice',event.candidate)
    }
});

// Listen for remote ICE candidates and add them to the local RTCPeerConnection
socket.on('icecandidate', async message => {
    if (message) {
        try {
            await peerConnection.addIceCandidate(message);
            console.log('receiving ice',message)
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
    }
});

// Listen for connectionstatechange on the local RTCPeerConnection
peerConnection.addEventListener('connectionstatechange', event => {
    if (peerConnection.connectionState === 'connected') {
        console.log('ok')
        socket.emit('accepted')
    }
});

socket.on('accepted',()=>{
    if (peerConnection.connectionState === 'connected') {
        makeCall()
    } else {
        console.log('Ignoring makeCall in an invalid state:', peerConnection.connectionState);
    }
})

peerConnection.addEventListener('track', async (event) => {
    const [remoteStream] = event.streams;
    stranger.srcObject = remoteStream;
    console.log('grot track',remoteStream)
});


function hangup(){
    peerConnection.close()
    stranger.srcObject = null
}

socket.on('hangup',()=>{
    hangup()
})



