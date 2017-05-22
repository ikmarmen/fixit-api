const router = require('express').Router();

const User = require('../models/user');


router.get('/:id', (req, res, next) => {
  next();
});


//creating a new user
router.post('/', (req, res, next) => {
  let user = new User(req.body);
  user.save((err, result) => {
    if (err) {
      next(new Error(err));
    }
    else {
      res.payload = "User created";
      next();
    }
  });
  
});


module.exports = router;

