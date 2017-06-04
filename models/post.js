const Promise = require('bluebird');
const validator = require('validator');
const mongoose = require('mongoose');

const photoScheme = mongoose.Schema({
  data: Buffer,
  width: Number,
  height: Number,
});

const addressScheme = mongoose.Schema({
  street:  String,
  city: String,
  state: String,
  country: String,
  zip: Number,
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

  //geospatial index (https://docs.mongodb.com/manual/applications/geospatial-indexes/)
  loc: {
    type: [Number], // [longitude, latitude]
    index: '2d',
  },

  address: {
    type: addressScheme,
    required: true,
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