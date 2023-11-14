let socket = io()
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
    start_call()
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
    }, 1000);

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
    }, 1000);
})


function scrollToBottom(){
    ChatDiv.scrollTop = ChatDiv.scrollHeight;
}
// webRTC video call Feature

let peerConnection;
const configuration = {
    iceServers: [
      {
        urls: [
            'stun:stun.l.google.com:19302',
          ],
      },
    ],
  };
  
  // Local peer initiates the call
  async function start_call() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      You.srcObject = stream;
  
      // Create an RTCPeerConnection if not already created
      if (!peerConnection) {
        createPeerConnection();
      }
  
      // Add the local stream to the peer connection
      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
  
      // Create an offer and set it as the local description
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
  
      // Send the offer to the signaling server
      socket.emit('offer', offer);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      start_call()
    }
  }
  
  // Function to create and configure the peer connection
  function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);
  
    // Handle ICE candidate events
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send the ICE candidate to the signaling server
        socket.emit('ice-candidate', event.candidate);
      }
    };
  
    // Event triggered when a remote stream is added to the peer connection
    peerConnection.ontrack = (event) => {
      // Display the remote stream on the 'stranger' element
      stranger.srcObject = event.streams[0];
      stranger.muted = false
    };
  
    // Additional ICE event handlers for logging purposes
    peerConnection.onicecandidateerror = (error) => {
      console.error('ICE candidate error:', error);
    };
  
    peerConnection.oniceconnectionstatechange = (event) => {
      console.log('ICE connection state change:', peerConnection.iceConnectionState);
    };
  
    peerConnection.onicegatheringstatechange = (event) => {
      console.log('ICE gathering state change:', peerConnection.iceGatheringState);
    };
  }
  
  // Remote peer receives the offer through the signaling server
  socket.on('offer', async (offer) => {
    try {
      // Create an RTCPeerConnection if not already created
      if (!peerConnection) {
        createPeerConnection();
      }
  
      // Set the remote description to the received offer
      await peerConnection.setRemoteDescription(offer);
  
      // Create an answer and set it as the local description
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
  
      // Send the answer to the signaling server
      socket.emit('answer', answer);
    } catch (error) {
      console.error('Error creating or setting answer:', error);
    }
  });
  
  // Remote peer receives the answer through the signaling server
  socket.on('answer', async (answer) => {
    try {
      // Set the remote description to the received answer
      await peerConnection.setRemoteDescription(answer);
    } catch (error) {
      console.error('Error setting remote description:', error);
    }
  });
  
 
  function hangup() {
    if (peerConnection) {
  
      // Close the peer connection
      peerConnection.close();
      peerConnection = null;
  
      // Clear the srcObject
      stranger.srcObject = null;
  
      socket.emit('hangup')
    }
  }
  

  socket.on('hangup',()=>{
    hangup()
  })

  socket.on('disconnect', () => {
    hangup();
    socket.emit('message', 'Disconnected ❗')
  });
  