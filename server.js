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

  emit(socket)
  socket.on('message', (newLog) => {
    console.log('new-------> ', newLog)
    mongoDb.add(newLog)
      .then(() => {
        emit(socket)
      })
  });

  socket.on('ssid', (ssidName) => {
    console.log('CLIENT SSID: ', ssidName)
  })
})

var emit = (socket) => {
  mongoDb.find()
    .then((logs) => {

      io.emit('update', logs)
    })
}

// Server
server.listen(port, () => {
  // console.log(`Listening on port ${port}... ------>`);
})