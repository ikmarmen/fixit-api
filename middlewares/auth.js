const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/user');

module.exports = (req, res, next) => {
  if (req.headers.token) {
    User.findByToken(req.headers.token)
      .then((user) => {
        console.log('token done', user, req.headers.token);
        if (user && user.isTokenValid(req.headers.token, req.deviceId)) {
          req.user = Object.assign({}, user.toJSON());
        }
      })
      .finally(() => next());
  } else {
    req.userData = false;
    next();
  }
};