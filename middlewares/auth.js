module.exports = (req, res, next) => {
  if (req.headers.token) {
    req.userData = {
      //dummy user data
    };
    next();
  } else {
    req.userData = false;
    next();
  }
};