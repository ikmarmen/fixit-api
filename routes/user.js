const router = require('express').Router();
const User = require('../models/user');
const requireAuth = require('../middlewares/require-auth');

router.get('/:id', requireAuth, (req, res, next) => {
  User.findById(req.params['id'])
    .then((user) => {
      res.payload = {
        profile: user
      };
      next()
    })
    .catch(err => {
      console.log(err.errors);
      next(new Error(err));
    });
});

router.post('/login', (req, res, next) => {
  console.log(req.body, req.files);
  res.payload = {
    token: false
  };
  User.login(req.body.email, req.body.password, req.deviceId)
    .then((token) => {
      res.payload = {
        token: token
      };
    })
    .finally(() => next());
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

//updating existing user
router.post('/save', requireAuth, (req, res, next) => {
  User.findById(req.body._id)
    .then((user) => {
      user = Object.assign(user, req.body);
      return user.save();
    })
    .then((user) => {
      res.payload = user;
      next();
    })
    .catch(err => {
      console.log(err.errors);
      next(new Error(err));
    });

});

//logauth
router.post('/logauth', requireAuth, (req, res, next) => {
  User.logauth(req.body.token)
    .then((isLogAuthed) => {
      return isLogAuthed;
    })
    .then((isLogAuthed) => {
      res.payload = isLogAuthed;
      next();
    })
    .catch(err => {
      console.log(err.errors);
      next(new Error(err));
    });
});

module.exports = router;

