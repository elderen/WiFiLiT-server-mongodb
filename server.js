const parser = require('body-parser');
const cors = require('cors');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// MongoDb
const mongoDb = require('./db.js');
const authDb = require('./authentication.js')

//configuring the AWS environment
const Key = require('./KEY.json')
AWS.config.update({
  accessKeyId: Key.Access_ID,
  secretAccessKey: Key.Access_Key
});

var s3 = new AWS.S3();
//custom made function to store photo to s3
const storePhoto = async (userPhotoPath, callback) => {
  //configuring parameters
  let params = {
    Bucket: 'wifilit',
    Body: fs.createReadStream(userPhotoPath),
    Key: "userPhotos/" + path.basename(userPhotoPath)
  };

  //uploading to s3 bucket
  await s3.upload(params, function (err, data) {
    //handle error
    if (err) {
      console.log("Error storing to S3 Bucket => ", err);
    }
    //success
    if (data) {
      console.log("Uploaded in:", data.Location);
    }
    callback();
  });
}

const retrievePhoto = async (user, callback) => {
  let localFile = `./s3/${user}`
  let params = {
    Bucket: 'wifilit',
    Key: "userPhotos/" + path.basename(user)
  };
  await s3.getObject(params, (err, data) => {
    if (err) {
      console.error("User photo not found in S3 Bucket", err);
      callback(false)
    } else {
      fs.writeFile(localFile, data.Body.toString(), () => {
        console.log(`${localFile} has been created!`);
        callback(true)
      })
    }
  })
}

// Websocket | HTTP | express
const app = require('express')();
app.use(cors());
app.use(parser.json());
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

  socket.on('postPhoto', (source) => {
    // console.log('source: ', typeof source)
    let localPath = `./data/${source.username}`
    // writing file to local file
    fs.writeFile(localPath, JSON.stringify(source), function (err) {
      if (err) {
        return console.log('Error downloading photo => ', err);
      } else {
        console.log(`User ${source.username}'s photo was saved!`);
        //dump to S3 bucket
        storePhoto(localPath, () => {
          fs.unlink(localPath, (err) => {
            if (err) {
              console.log("failed to delete local image:" + err);
            } else {
              console.log('successfully deleted local image from /data');
            }
          });
        })
      }
    });
  })

  socket.on('retrievePhoto', (user) => {
    fs.readFile(`./s3/${user}`, "utf8", (err, data) => {
      if (data) {
        io.to(`${socket.id}`).emit('retrievePhoto', data)
      } else {
        retrievePhoto(user, (successful) => {
          if (successful) {
            // console.log(`./s3/${user}`)
            fs.readFile(`./s3/${user}`, "utf8", (err, data) => {
              if (err) console.log('Cant read the file from S3 bucket', err)
              else io.to(`${socket.id}`).emit('retrievePhoto', data)
            })
          } else {
            io.to(`${socket.id}`).emit('retrievePhoto', false)
          }
        })
      }
    })

  })

})

var emit = (room) => {
  mongoDb.find(room)
    .then((logs) => {
      io.to(room).emit('update', logs)
    })
}

// every minute it deletes a file thats 10+ minutes old
const deleteS3OverTime = (uploadsDir) => {
  fs.readdir(uploadsDir, function (err, files) {
    files.forEach(function (file, index) {
      fs.stat(path.join(uploadsDir, file), function (err, stat) {
        var endTime, now;
        if (err) {
          return console.error(err);
        }
        now = new Date().getTime();
        endTime = new Date(stat.ctime).getTime() + 600000;
        if (now > endTime) {
          console.log(`Successfully deleted ${file} from s3 folder`)
          return fs.unlinkSync(path.join(uploadsDir, file))
        }
      });
    });
  });
}
const uploadsDir = __dirname + '/s3';
setInterval(() => { deleteS3OverTime(uploadsDir) }, 60000)

// Server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  // console.log(`Listening on port ${port}... ------>`);
})