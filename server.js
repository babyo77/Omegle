const express = require('express');
const app = express();
const server = require('http').Server(app)
const socketIO = require('socket.io');
const io = socketIO(server, {
  cors: true,
});

const PORT = process.env.PORT || 3000;
app.use(express.static('public'));

let waiting_users = new Map();
let users = 0

io.on('connection', (socket) => {
  let userCount = users++

  socket.on('mediaTaken',()=>{
    console.log('get')
    socket.emit('peer')
  })
socket.on('connected',()=>{
  waiting_users.set(userCount, socket.id);
  console.log(waiting_users)
  socket.emit('connected')
  pair()
})

  socket.on('next', () => {
    socket.emit('pairing', 'Finding Partner 🔎')
    const rooms = Array.from(socket.rooms)
    const room = rooms.length > 1 ? rooms[1] : null;
    socket.broadcast.to(room).emit('message:recieved', 'Stranger left The Chat');
    socket.leave(room)
    waiting_users.set(userCount, socket.id);
    pair()
  })

  socket.on('calling', id => {
    const rooms = Array.from(socket.rooms)
    const room = rooms.length > 1 ? rooms[1] : null;
    socket.broadcast.to(room).emit('call-Accepted', id);
  })

  socket.on('disconnect', () => {
    console.log(socket.id + ' left')
    waiting_users.delete(userCount, socket.id);
  });

  socket.on('message', (data) => {
    const rooms = Array.from(socket.rooms);
    const room = rooms.length > 1 ? rooms[1] : null;
    socket.to(room).emit('message:recieved', data);
  });
  socket.on('typing', () => {
    const rooms = Array.from(socket.rooms);
    const room = rooms.length > 1 ? rooms[1] : null;
    socket.broadcast.to(room).emit('typing');
  })

})

function pair() {
  if (waiting_users.size > 1) {

    let id = Array.from(waiting_users.entries())

    let user1 = id[0]
    let user2 = id[1]

    const room = `baby${user1}_${user2}`

    io.sockets.sockets.get(waiting_users.get(user1[0])).join(room)
    io.sockets.sockets.get(waiting_users.get(user2[0])).join(room)

    io.to(room).emit('paired', 'Partner Found 🦄 - Chat Connected', room);

    console.log('joined', user1, user2, room)

    waiting_users.delete(user1[0])
    waiting_users.delete(user2[0])

    console.log(user1, user2)
    console.log(waiting_users)
  }

}


server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
