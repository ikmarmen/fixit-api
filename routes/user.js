const router = require('express').Router();

const User = require('../models/user');


router.get('/:id', (req, res, next) => {
  res.payload = {
    profile: {}
  };
  next();
});


//creating a new user
router.post('/', (req, res, next) => {
  let user = new User(req.body);
  console.log('token', user.createToken(req.deviceId));

  user.save((err, result) => {
    if (err) {
      console.log(err.errors);
      next(new Error(err));
    }
    else {
      res.payload = result;
      next();
    }
  });
  
});


module.exports = router;

