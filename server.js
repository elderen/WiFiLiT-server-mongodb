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
  console.log('<---- Socket Io Connection Established ------>')
  console.log('** Console Id: ', console.id);

  emit(socket)
  socket.on('message', (newLog) => {
    console.log('new-------> ', newLog)
    mongoDb.add(newLog)
    emit(socket)
  });
})

var emit =  (socket) => {
  let logs =  retrieve.all('lobby');
  io.emit('update', logs)
}

// Server
server.listen(port, () => {
  // console.log(`Listening on port ${port}... ------>`);
})