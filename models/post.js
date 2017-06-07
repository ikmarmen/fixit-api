const Promise = require('bluebird');
const validator = require('validator');
const mongoose = require('mongoose');

const photoSchema = mongoose.Schema({
    data: Buffer,
    width: Number,
    height: Number,
});
const bidSchema = mongoose.Schema({
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
        { type: mongoose.Schema.ObjectId, ref: 'Comment' }
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
const addressSchema = mongoose.Schema({
    street: String,
    city: String,
    state: String,
    country: String,
    zip: Number,
});
const postSchema = mongoose.Schema({
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
        type: addressSchema,
        required: true,
    },

    photos: [photoSchema],

    comments: [commentSchema],

    bids: [bidSchema],

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

var Address = mongoose.model('Address', addressSchema, 'addresses');
var Comment = mongoose.model('Comment', commentSchema, 'comments');
var Photo = mongoose.model('Photo', photoSchema, 'photos');
var Bid = mongoose.model('Bid', bidSchema, 'bids');

postSchema.statics.findByid = function (id) {
    return this.findById(id)
        .then((post) => {
            return post;
        });
};

postSchema.statics.addBid = function (postId, bid) {
    return this.findById(postId)
        .then((post) => {
            post.bids.push(new Bid(bid));
            return post.save();
        })
};

module.exports = mongoose.model('Post', postSchema, 'posts'); 