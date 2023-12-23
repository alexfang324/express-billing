const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    validate: [emailValidator, 'email provided is not in correct format']
  },
  username: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String
  },
  roles: {
    type: Array,
    required: true
  }
});

function emailValidator(value) {
  return /^\S+@\S+\.\S+$/.test(value);
}

// Add passport-local-mongoose to our Schema
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

module.exports = User;
