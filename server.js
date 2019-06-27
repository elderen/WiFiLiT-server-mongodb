const express = require('express');
const path = require('path');
const cors = require('cors');
const port = process.env.PORT || 3000;

// Better-SQLite3 methods
const { insert, retrieve } = require('./db.js');

// Websocket | HTTP | express
const app = express();
app.set('port', port)
const server = require('http').Server(app);
const io = require('socket.io')(server);

// Single Websocket Connection
io.on('connection', (socket) => {
  // console.log('<---- Socket Io Connection Established ------>')
  // console.log('** Console Id: ', console.id);

  emit(socket)
  socket.on('message', (newLog) => {
    // console.log('new-------> ', newLog)
    insert.run(newLog.room, newLog.user, newLog.message)
    emit(socket)
  });
})

var emit =  (socket) => {
  let logs =  retrieve.all('lobby');
  io.emit('update', logs)
}

// Middleware
app.use(express.static(path.join(__dirname, 'public')))
app.use(cors());

// Server
server.listen(port, () => {
  // console.log(`Listening on port ${port}... ------>`);
})