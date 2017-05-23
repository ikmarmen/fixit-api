const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/user');

module.exports = (req, res, next) => {
  if (req.headers.token) {
    User.findByToken(req.headers.token, (err, userInfo) => {
      req.user = userInfo;
      console.log('userInfo', userInfo);
      // delete userInfo.password;
      // delete userInfo.__v;
      // delete userInfo.tokens;
      // Object.assign(req.user, userInfo);
      next();
    });
  } else {
    req.userData = false;
    next();
  }
};