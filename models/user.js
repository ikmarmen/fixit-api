const validator = require('validator');
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');

const SALT_WORK_FACTOR = 9;

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

  password: {
    type: String,
    minlength: 5,
    maxlength: 50,
    required: [true, 'Password is required']
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

  tokens: {
    type: [],
    index: true,
  },

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

userSchema.pre('save', function (next) {
  let user = this;

  if (!user.isModified('password')) {
    return next();
  }

  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) {
      return next(err);
    }
    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function (candidatePassword, callback) {
  bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
    if (err) {
      return callback(err);
    }
    callback(null, isMatch);
  });
};

userSchema.methods.createToken = function (deviceId) {
  let token = jwt.sign({
    usderId: this._id,
  }, config.tokenSecret, {
      audience: deviceId
    });
  this.tokens.push(token);
  return token;
};

userSchema.methods.isTokenValid = function (token, deviceId) {
  try {
    let tokenData = jwt.verify(token, config.tokenSecret, { audience: deviceId });
    return this.tokens.indexOf(token) !== -1;
  }
  catch (err) {
    return false;
  }
};

userSchema.statics.findByToken = function (token, cb) {
  return this.findOne({ tokens: {$in: [token]} }, cb);
};

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema, 'users'); 