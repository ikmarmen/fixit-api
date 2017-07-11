const Promise = require('bluebird');
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

userSchema.methods.comparePassword = function (candidatePassword) {
  let user = this;
  return new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, this.password, (err, ok) => {
      ok ? resolve() : reject();
    });
  });
};

userSchema.methods.createToken = function (deviceId) {
  let user = this;
  return new Promise((resolve, reject) => {
    let newToken = jwt.sign({
      usderId: user._id,
    }, config.tokenSecret, {
        audience: deviceId
      });

    let foundToken = false;
    for (let i = 0; i < user.tokens.length; i++) {
      let tokenData = jwt.verify(user.tokens[i], config.tokenSecret);
      if (tokenData['aud'] && tokenData['aud'] === deviceId) {
        foundToken = i;
        break;
      }
    }
    if (foundToken !== false) {
       user.tokens.splice(foundToken, 1);
    }
    else {
      user.tokens.push(newToken);
    }
    
    user.tokens.push(newToken);

    user.save((err) => {
      console.log('token update done', err);
      !err ? resolve(newToken) : reject(err);
    });

  });
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

userSchema.statics.findByToken = function (token) {
  return this.findOne({ tokens: { $in: [token] } });
};

userSchema.statics.findByid = function (id) {
  return this.findById(id)
    .then((user) => {
      return user;
    });
};

userSchema.statics.login = function (email, password, deviceId) {
  return this.findOne({ email: email })
    .then((user) => {
      if (user) {
        return user.comparePassword(password)
          .then(() => user.createToken(deviceId));
      }
      else {
        return false;
      }
    });
};
userSchema.statics.logauth = function (token) {
  return this.findOne({ tokens: token })
    .then((user) => {
      if (user) {
        user.tokens.pull(token);
        user.save();
        return true;
      }
      return false;
    });
};

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema, 'users'); 