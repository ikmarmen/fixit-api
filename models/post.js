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
const addressSchema = mongoose.Schema({
  street: String,
  city: String,
  state: String,
  country: String,
  zip: Number,
});
const answerSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  body: {
    type: String,
    index: true,
    required: true
  },
  createdAt: {
    type: Date,
    required: true,
    default: new Date(),
  }
});
const questionSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  body: {
    type: String,
    index: true,
    required: true
  },
  answer: {
    type: answerSchema
  },
  createdAt: {
    type: Date,
    required: true,
    default: new Date(),
  }
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
    index: '2dsphere',
  },
  address: {
    type: addressSchema
  },
  questions: [questionSchema],
  photos: [photoSchema],
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
var Photo = mongoose.model('Photo', photoSchema, 'photos');
var Bid = mongoose.model('Bid', bidSchema, 'bids');
var Question = mongoose.model('Question', questionSchema, 'questions');
var Answer = mongoose.model('Answer', answerSchema, 'answers');

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

postSchema.statics.addQuestion = function (postId, question) {
  return this.findById(postId)
    .then((post) => {
      post.questions.push(new Question(question));
      return post.save();
    })
};

postSchema.statics.addAnswer = function (postId, questionId, answer) {
  return this.update(
    { "_id": postId, "questions._id": questionId },
    { "questions.$.answer": new Answer(answer) }
  ).then((post)=>{
    return;
  })

  /* return this.findById(postId)
     .then((post) => {
       return post.questions.findById(questionId).then(question);
       return post.save();
     })*/
};

module.exports = mongoose.model('Post', postSchema, 'posts'); 