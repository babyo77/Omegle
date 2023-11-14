const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let waiting_users = new Map();
let users = 0

io.on('connection', (socket) => {

let userCount = users++
  waiting_users.set(userCount,socket.id);
  console.log(waiting_users)
pair()

socket.on('next',()=>{
  socket.emit('pairing','Finding Partner 🔎')
  const rooms = Array.from(socket.rooms)
  const room = rooms.length > 1 ?rooms[1] : null;
  socket.broadcast.to(room).emit('message:recieved','Stranger left The Chat');
  socket.leave(room)
  waiting_users.set(userCount,socket.id);
  pair()
})

  socket.on('disconnect', () => {
    console.log(socket.id + ' left')
    waiting_users.delete(userCount,socket.id);
  });

  socket.on('offer', (offer) => {
    const rooms = Array.from(socket.rooms);
    const room = rooms.length > 1 ? rooms[1] : null;
    socket.broadcast.to(room).emit('offer', offer);
  });

  socket.on('answer', (answer) => {
    const rooms = Array.from(socket.rooms);
    const room = rooms.length > 1 ? rooms[1] : null;
    socket.broadcast.to(room).emit('answer', answer);
  });

  socket.on('ice-candidate', (iceCandidate) => {
    const rooms = Array.from(socket.rooms);
    const room = rooms.length > 1 ? rooms[1] : null;
    socket.broadcast.to(room).emit('ice-candidate', iceCandidate);
  });

  socket.on('hangup', () => {
    console.log('Hangup event received from a client');
    const rooms = Array.from(socket.rooms);
    const room = rooms.length > 1 ? rooms[1] : null;

    // Broadcast the hangup event to all connected clients (if needed)
    socket.broadcast.to(room).emit('hangup');
  });

  socket.on('message', (data) => {
    const rooms = Array.from(socket.rooms);
    const room = rooms.length > 1 ? rooms[1] : null;
        socket.broadcast.to(room).emit('message:recieved', data);
});

})

function pair(){
  if(waiting_users.size>1){

    let id = Array.from(waiting_users.entries())
    //  shuffleArray(id)
    
    let user1 = id[0]
    let user2 = id[1]

const room = `baby${user1}_${user2}`

 io.sockets.sockets.get(waiting_users.get(user1[0])).join(room)
 io.sockets.sockets.get(waiting_users.get(user2[0])).join(room)

 io.to(room).emit('paired', 'Partner Found 🦄 - Chat Connected',room); 

console.log('joined',user1,user2,room )

    waiting_users.delete(user1[0])
    waiting_users.delete(user2[0])

    console.log(user1 ,user2)
    console.log(waiting_users)
  }

}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}


server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
