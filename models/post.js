const Promise = require('bluebird');
const validator = require('validator');
const mongoose = require('mongoose');

const photoScheme = mongoose.Schema({
  data: Buffer,
  width: Number,
  height: Number,
});

const postScheme = mongoose.Schema({
  title: {
    type: String,
    index: true,
    minlength: 5,
    maxlength: 50,
    required: [true, 'Post title is required']
  },

  description: {
    type: String,
    index: true,
    maxlength: 500,
  },

  photos: [photoScheme],

  createdAt: {
    type: Date,
    required: true,
    default: new Date(),
  },

  updatedAt: {
    type: Date,
    required: true,
    default: new Date(),
  }

});