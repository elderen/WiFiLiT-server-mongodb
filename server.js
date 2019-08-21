const cors = require('cors');
const port = process.env.PORT || 3000;

// MongoDb
const mongoDb = require('./db.js');
const authDb = require('./authentication.js')

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

  socket.on('signup', (data) => {
    console.log('data: ', data)
    authDb.findUser(data)
      .then((userExist) => {
        if (userExist.length === 0) {
          authDb.addUser(data)
            .then((results) => {
              // console.log('results: ', results)
              let newUserData = {
                username: results.username,
                bool: 'true'
              }
              io.to(`${socket.id}`).emit('newUser', newUserData);
            })
        } else {
          console.log(`Unable to create new account: User "${data.username}" is already taken!`)
          let takenUserData = {
            username: data.username,
            bool: 'false'
          }
          io.to(`${socket.id}`).emit('newUser', takenUserData);
        }
      })
  })

  socket.on('signin', (loginAttempt) => {
    console.log('Checking login info: ', loginAttempt)
    authDb.findUser(loginAttempt)
      .then((userExist) => {
        // if user doesn't exist
        // console.log('userExist? ', userExist)
        if (userExist.length === 0) {
          io.to(`${socket.id}`).emit('loginResult', `Username "${loginAttempt.username}" doesn't exist`)
        } else {
          // console.log(`Unable to Create New Account: User "${this.username}" already exists!`)
          console.log("match? ", userExist[0].password, loginAttempt.password)
          if (userExist[0].password === loginAttempt.password) {
            io.to(`${socket.id}`).emit('loginResult', "allow")
          } else {
            io.to(`${socket.id}`).emit('loginResult', "Wrong Password")
          }
        }
      })

    // io.to(`${socket.id}`).emit('uniqueId', '#id');
  })

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