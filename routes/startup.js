const router = require('express').Router();


router.get('/', (req, res, next) => {
  res.payload = {
    msg: "Hello from FixIt API",
    user: req.user,
  };
  next();
});



module.exports = router;

