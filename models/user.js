const validator = require('validator');
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const bcrypt = require('bcrypt');

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

userSchema.methods.comparePassword = function (candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
    if (err) {
      return cb(err);
    }
    cb(null, isMatch);
  });
};

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema, 'users');