const router = require('express').Router();
const multer = require('multer');
const Post = require('../models/post');

const fileUpload = multer();

// router.get('/:id', (req, res, next) => {
//   res.payload = {
//     profile: {}
//   };
//   next();
// });

router.post('/', fileUpload.array("photos", 10), (req, res, next) => {
  res.payload = req.body;
  console.log(req.body, req.files);
  next();
});

module.exports = router;

