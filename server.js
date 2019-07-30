const cors = require('cors');
const port = process.env.PORT || 3000;

// MongoDb
const mongoDb = require('./db.js');

// Websocket | HTTP | express
const app = require('express')();
app.use(cors());
const server = require('http').Server(app);
const io = require('socket.io')(server);

// Single Websocket Connection
io.on('connection', (socket) => {
  console.log('<-------- Socket Io Connection Established --------->')
  console.log('Current Socket Id: ', socket.id);
  console.log('# of Sockets Connected: ', Object.keys(io.sockets.sockets).length);
  console.log('Sockets: ', Object.keys(io.sockets.sockets));
  
  socket.on('ssid', (ssidName) => {
    console.log('CLIENT SSID: ', ssidName)
    socket.join(ssidName);
    emit(ssidName)
  })
  
  socket.on('message', (newLog, ss) => {
    console.log('new-------> ', newLog, ss)
    mongoDb.add(newLog)
      .then(() => {
        emit(ss)
      })
  });
})

var emit = (room) => {
  mongoDb.find(room)
    .then((logs) => {
      io.to(room).emit('update', logs)
    })
}

// Server
server.listen(port, () => {
  // console.log(`Listening on port ${port}... ------>`);
})