const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const url = "mongodb://localhost:27017/wifilit";

let loginSchema = new mongoose.Schema(
  {
    username: String,
    password: String
  }
);


// loginSchema.pre("save", function (next) {
//   console.log('.Pre Middleware Hit', this)
//   Login.find({ username: this.username })
//     .exec()
//     .then((data) => {
//       // data is an array of the Find results
//       if (data.length === 0) {
//         next()
//       } else {
//         console.log(`Unable to Create New Account: User "${this.username}" already exists!`)
//         // return new Promise((resolve, reject) => {
//         //   resolve(console.log('something went wrong', this.isNew));
//         // });
//       }
//     })
// })

// mongoose.connect(url, { useNewUrlParser: true });
console.log(`<#------ Connecting To ${url} collection 'login'...`)

const Login = mongoose.model('Login', loginSchema, 'login');

module.exports = {
  addUser: (incoming) => {
    return Login.create(
      {
        username: incoming.username,
        password: incoming.password
      })
  },

  findUser: (incoming) => {
    return Login.find({ username: incoming.username })
      .exec()
  },

  deleteAllUsers: () => {
    return Login.deleteMany({});
  }
}