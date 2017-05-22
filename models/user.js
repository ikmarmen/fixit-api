const validator = require('validator');
const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  email: {
    type: String,
    unique: true,
    validate: {
      isAsync: false,
      validator: (val) => validator.isEmail(val),
      message: '{VALUE} is not a valid email address'
    },
    required: [true, 'Email address is required']
  },

  firstName: {
    type: String,
    required: [true, 'First name is required'],
  },

  lastName: {
    type: String,
    required: [true, 'Last name is required'],
  },

  profilePic: Buffer,

  social: {
    facebook: String,
    google: String,
    twitter: String,
  },

  lastActiveAt: {
    type: Date,
    required: true,
    default: new Date(),    
  },

  registeredAt: {
    type: Date,
    required: true,
    default: new Date(),
  },
});

module.exports = mongoose.model('User', userSchema, 'users');