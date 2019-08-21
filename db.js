const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const url = "mongodb://localhost:27017/wifilit";

let chatSchema = new mongoose.Schema(
  {
    user: String,
    room: String,
    message: String
  },
  {
    timestamps: { createdAt: 'created', updatedAt: false },
    versionKey: false
  }
);

mongoose.connect(url, { useNewUrlParser: true });
console.log(`<#------ Connecting To ${url} collection 'lobby'...`)

const Chat = mongoose.model('Chat', chatSchema, 'lobby');

module.exports = {
  add: (incoming) => {
    return Chat.create(
      {
        user: incoming.user,
        room: incoming.room,
        message: incoming.message
      })
  },

  find: (ssid) => {
    return Chat.find({room: ssid})
                .skip(Chat.count() - 100)
                .exec()
  },

  deleteAll: () => {
    return Chat.deleteMany({});
  }
}