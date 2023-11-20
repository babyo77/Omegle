/* define all Variables */

let socket = io()
let peer;
let call;
let YourID;

/* get user video and audio access */

navigator.mediaDevices.getUserMedia({ 
    video: {
        width: { ideal: 1280, max: 1920, min: 640, auto: true },
        height: { ideal: 720, max: 1080, min: 360, auto: true },
        frameRate: { ideal: 30, max: 60, auto: true },
    },
     audio: {
        autoGainControl: false,
        noiseSuppression: false,
        echoCancellation: false,
        sampleRate: 44100,
        channelCount: 2,
    },
 })
.then((stream) => {
        You.srcObject = stream
        localStream = stream
        console.log('takes')
        socket.emit('mediaTaken')
    })
    .catch((error) => {
        console.error('Error accessing media devices:', error);
    });
    socket.on('peer',()=>{
        peer = new Peer(undefined, {
            path: '/peerjs',
            host: '/',
            port: '443',
            config: {
                iceServers: [
                  { urls: 'stun:stun.l.google.com:19302' },
                ],
              },
          });  
        peer.on('open', id => {
            YourID =  id
            console.log('YOUR ID', YourID)
             socket.emit('connected')
             ok()
        })
        peer.on('error',()=>{
            alert('Server is Down')
            window.open('https://instagram.com/babyo7_?utm_source=qr')
        })
    })

let localStream;
let RemoteID;
let connectionstatus = document.getElementById('connection-status')
let Chat = document.getElementById('chat')
let ChatDiv = document.getElementById('ChatDiv')
let messageInput = document.getElementById('message')
let stranger = document.getElementById('stranger')
let You = document.getElementById('you')
let paired = false
let nextcall = true
let TypinStatus = false

/* on socket connect change the connnection status */

socket.on('connected', () => {
    connectionstatus.classList = []
    color('')
    connectionstatus.textContent = "Finding Partner 🔎"
})

/* color for connection status */

function color(ok) {
    connectionstatus.classList.remove('text-red-500', 'text-green-500');
    if (ok) {
        connectionstatus.classList.add('text-red-500')
    } else {
        connectionstatus.classList.add('text-green-500')
    }

}

/* for next */

function findNextRoom() {
    stranger.srcObject = null
    stranger.muted = true
    paired = false
    call.close()
    socket.emit('next')
    console.log('next')
}

/* event when paired */

socket.on('paired', (msg) => {
    color('')
    connectionstatus.textContent = msg
    paired = true
    Chat.innerHTML = ''
    setTimeout(() => {
        if (!nextcall) {
            socket.emit('calling', YourID)
            console.log(YourID)
            nextcall = true
        } else {
            socket.emit('calling', YourID)
            console.log(YourID)
            console.log('next call')
        }
    }, 1000);
})

/* when user close the window or reload */

window.onbeforeunload = () => {
    if(call && call.open){
        call.close()
    }
    socket.emit('message', 'Disconnected ❗')
    Chat.innerHTML = ''
}

/* event when pairing */

socket.on('pairing', (msg) => {
    connectionstatus.textContent = msg
    Chat.innerHTML = ''
    paired = false
})

/* funtion for making messages */

function createMessage(from, message, id) {
    const msg = document.createElement('p')
    msg.textContent = `${from}: ${message}`
    msg.id = id || 'message'
    if (message == 'Disconnected❗') {
        msg.textContent = message
        paired = false
    } else if (from == 'Stranger') {
        msg.classList.add('text-red-500')
    }
    Chat.append(msg)
    scrollToBottom()
}

/* event to listen to all incoming messages */

socket.on('message:recieved', (msg) => {
    paired = true
    if (paired && connectionstatus.textContent == 'Chat Disconnected❗') {
        Chat.innerHTML = ''
        connectionstatus.textContent = 'Partner Found 🦄 - Chat Connected'
    }
    const typing = document.querySelectorAll('#typing')
    typing.forEach(typingMSG => {
        if (typing) {

            typing.forEach(msg => {
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

/* function to send message */

function sendMessage() {
    if (messageInput.value == 'Disconnected ❗' || messageInput.value == 'Stranger left The Chat') {
        return
    }
    if (messageInput.value.trim() && paired === true) {
        socket.emit('message', messageInput.value)
        createMessage('You', messageInput.value)
        messageInput.value = ""
        scrollToBottom()
    }

}

/* Send message when enter pressed */

messageInput.addEventListener('keydown', (e) => {
    if (e.key == 'Enter') {
        sendMessage()
    }
})

/* next wehn Esc pressed */

document.addEventListener('keydown', (e) => {
    if (e.key == 'Escape') {
        findNextRoom()
    }
})

/*send event when typing */

messageInput.addEventListener('input', () => {
    if (!TypinStatus) {
        TypinStatus = true
        socket.emit('typing')
        scrollToBottom()
    }

    setTimeout(() => {
        TypinStatus = false
        const typing = document.querySelectorAll('#typing')
        typing.forEach(msg => {
            if (typing) {

                typing.forEach(msg => {
                    msg.remove()
                })
            }
        })
    }, 1300);

})

/* event to listen when typing */

socket.on('typing', () => {
    if (!TypinStatus) {
        createMessage('Stranger', 'Typing..', 'typing')
        TypinStatus = true
        scrollToBottom()
    }

    setTimeout(() => {
        TypinStatus = false
        const typing = document.querySelectorAll('#typing')
        if (typing) {

            typing.forEach(msg => {
                msg.remove()
            })
        }
    }, 1300);
})

/* scroll to bottom when new message send */

function scrollToBottom() {
    ChatDiv.scrollTop = ChatDiv.scrollHeight;
}

/* event to listen when call */
function ok(){

    peer.on('call', (call) => {
        call.answer(localStream);
        call.on('stream', (stream) => {
            stranger.srcObject = stream;
        });
    });
}
    
/* when call accepted */

socket.on('call-Accepted', id => {
    RemoteID = id
    console.log('incoming call', id)
    makeCall()
})

/* funtion to call when paired */

function makeCall() {
    call = peer.call(RemoteID, localStream);
    call.on('stream', (stream) => {
        stranger.srcObject = stream;
        stranger.muted = false
        console.log('call accepted from', RemoteID)
    });
    call.on('end',()=>{
      console.log('call ended');
    })
    call.on("error", function (err) {
        console.error(err);
        stranger.srcObject = null
        socket.emit('message', 'Disconnected ❗')
        Chat.innerHTML = ''
    });
}
