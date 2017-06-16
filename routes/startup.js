const router = require('express').Router();
const requireAuth = require('../middlewares/require-auth');

router.get('/', requireAuth, (req, res, next) => {
  res.payload = {
    user: req.user,
  };
  next();
});



module.exports = router;

