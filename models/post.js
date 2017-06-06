const Promise = require('bluebird');
const validator = require('validator');
const mongoose = require('mongoose');

const photoScheme = mongoose.Schema({
    data: Buffer,
    width: Number,
    height: Number,
});

const addressScheme = mongoose.Schema({
    street: String,
    city: String,
    state: String,
    country: String,
    zip: Number,
});

const bidScheme = mongoose.Schema({
    price: {
        type: String,
        required: true
    },
    comment: {
        type: String,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
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

const commentSchema = mongoose.Schema({
    body: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    replies: [
        { type: Schema.ObjectId, ref: 'Person' }
    ],
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

    comments: [commentSchema],

    bids: [bidScheme],

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

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