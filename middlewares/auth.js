const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/user');

module.exports = (req, res, next) => {
  if (req.headers.token) {
    User.findByToken(req.headers.token, (err, user) => {
      if (user && user.isTokenValid(req.headers.token, req.deviceId)) {
        req.user = Object.assign({}, user.toJSON());
      }
      next();
    });
  } else {
    req.userData = false;
    next();
  }
};