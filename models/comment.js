const Promise = require('bluebird');
const validator = require('validator');
const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'Post'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  parentId: {
    type: mongoose.Schema.ObjectId,
    default: null,
    ref: 'Comment'
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
  },
  updatedAt: {
    type: Date,
    required: true,
    default: new Date(),
  }
});

commentSchema.statics.getComments = function (postId) {
  return new Promise((resolve, reject) => {
    this.find({ postId: postId }).lean().sort({ createdAt: 'asc' }).exec((err, comments) => {
      if (err) {
        reject();
      }
      if (comments.length === 0) {
        resolve([]);
      }

      //JSON.parse(JSON.stringify(comments)) Ugly hack
      let thread = buildCommentBranchRecursive(null, JSON.parse(JSON.stringify(comments)));
      resolve(thread);
    });
  });
};

function buildCommentBranchRecursive(parentId, allComments) {
  let siblings = allComments.filter(c => c.parentId === parentId);
  let comments = [];

  siblings.forEach((node) => {
    var comment = node;
    comment.children = buildCommentBranchRecursive(comment._id, allComments);
    comments.push(comment);
  });

  return comments;
}

module.exports = mongoose.model('Comment', commentSchema, 'comments');
