const Promise = require('bluebird');
const validator = require('validator');
const mongoose = require('mongoose');

const photoSchema = mongoose.Schema({
  data: Buffer,
  width: Number,
  height: Number,
}, { usePushEach: true });
const contactSchema = mongoose.Schema({
  contact: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  }
}, { usePushEach: true });
const answerSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  isPublic:{
    type: Boolean,
    default: true,
  },
  body: {
    type: String,
    index: true,
    required: true
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  }
}, { usePushEach: true });
const bidSchema = mongoose.Schema({
  amount: {
    type: [Number],
    required: true
  },
  duration: {
    type: [Number],
    required: true
  },
  message: {
    type: String,
  },
  contacts: [contactSchema],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now,
  }
}, { usePushEach: true });
const addressSchema = mongoose.Schema({
  street: String,
  city: String,
  state: String,
  country: String,
  zip: Number,
}, { usePushEach: true });
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
    default: Date.now,
  }
}, { usePushEach: true });
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
  status: {
    type: String,
    required: [true, 'Post status is required']
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
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now,
  }
}, { usePushEach: true });

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
      let bidSchema = new Bid(bid);
      post.bids.push(bidSchema);
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
  ).then((post) => {
    return;
  })

  /* return this.findById(postId)
     .then((post) => {
       return post.questions.findById(questionId).then(question);
       return post.save();
     })*/
};

module.exports = mongoose.model('Post', postSchema, 'posts'); 