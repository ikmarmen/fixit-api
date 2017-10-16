const router = require('express').Router();
const multer = require('multer');
const Post = require('../models/post');
const async = require('async');
const gm = require('gm');
const qs = require('qs');
const requireAuth = require('../middlewares/require-auth');

const fileUpload = multer();

const imageJob = (buffer, callback) => {
  let img = gm(buffer);
  img.size((err, size) => {
    if (!err) {
      let width = size.width / 2,
        height = size.height / 2;
      img.resize(size.width / 2, size.height / 2)
        .noProfile()
        .compress('JPEG')
        .toBuffer('JPEG', (err, buffer) => {
          err ? callback(err) : callback(null, { data: buffer, height: height, width: width });
        });
    } else {
      callback(err)
    }
  });
};

const processImages = (files) => {
  return new Promise((resolve, reject) => {
    let jobs = [];
    for (let i = 0; i < files.length; i++) {
      let job = imageJob.bind(null, files[i].buffer);
      jobs.push(job);
    }
    //run in parallel
    async.parallel(jobs, (err, result) => {
      err ? reject() : resolve(result);
    });
    //runs in series (each job will wait until the previews one is done)
    // async.series(jobs, (err) => {
    //   err ? reject() : resolve();
    // });
  });

};

const postsToModel = (results) => {
  let posts = [];
  results.forEach(function (doc) {
    posts.push({
      _id: doc._id,
      title: doc.title,
      description: doc.description,
      createdAt: doc.createdAt,
      viewsCount: '52',
      createdBy: doc.createdBy && doc.createdBy.length ? (doc.createdBy[0].firstName +' '+ doc.createdBy[0].lastName) :'',
      bids: doc.bids,
      questions: doc.questions,
      photos: doc.photos.map((photo) => { return { _id: photo._id } }),
      distance: parseInt(doc.dist / 1000) || 0,
    });
  });
  return posts;

};

router.post('/', fileUpload.array("photos", 10), requireAuth, (req, res, next) => {
  processImages(req.files)
    .then((result) => {
      let postData = Object.assign({}, req.body, { userId: req.user._id, photos: result });
      let post = new Post(postData)

      post.save((err, result) => {
        if (err) {
          console.log(err.errors);
          next(new Error(err));
        }
        else {
          res.payload = result;
          next();
        }
      });
    })
    .catch((err) => {
      console.log('err', err);
      next();
    });

});

router.post('/all', requireAuth, (req, res, next) => {
  var request = qs.parse(req.body);

  var aggregateArray = [];

  //Search by distance
  var lng = parseFloat(request.longitude);
  var lat = parseFloat(request.latitude);
  var maxDistance = parseFloat(request.maxDistance);
  if (lng && lat && maxDistance != null) {
    aggregateArray.push({
      $geoNear: {
        near: { type: "Point", coordinates: [lng, lat] },
        distanceField: "dist",
        maxDistance: (maxDistance * 1000),
        spherical: true
      },
    });
  }

  aggregateArray.push({
    $lookup:
    {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "createdBy"
    }
  });

  //Search by search keyword
  if (request.search) {
    aggregateArray.push({ '$match': { 'title': { '$regex': request.search, $options: 'si' } } });
  }
  //Order resault
  if (request.order) {
    var sort = {};
    var direction = request.order.direction == 'desc' ? 1 : -1;
    if (request.order.by == 'createdDate') {
      sort.createdAt = direction;
    } else if (request.order.by == 'distanse') {
      sort.dist = direction;
    } else {
      sort = { createdAt: -1, dist: 1 };
    }

    aggregateArray.push({ '$sort': sort });
  }
  //Paging
  var skip = parseInt(request.skip);
  var take = parseInt(request.take);
  if (skip != null && take != null) {
    aggregateArray.push({ '$skip': skip });
    aggregateArray.push({ '$limit': take });
  }

  Post.aggregate(aggregateArray
  ).then((posts) => {
    res.payload = postsToModel(posts);
    next()
  })
    .catch(err => {
      console.log(err.message);
      next(new Error(err));
    });
});

router.post('/my', requireAuth, (req, res, next) => {
  var skip = parseInt(req.body.skip);
  var take = parseInt(req.body.take);

  Post.find({ userId: req.user._id }).then((posts) => {
    res.payload = postsToModel(posts);
    next()
  })
    .catch(err => {
      console.log(err.message);
      next(new Error(err));
    });
});

router.get('/photo/:id', (req, res, next) => {
  Post.find({ 'photos._id': req.params['id'] }, { 'photos.$': 1 }, 'photos.data, photos._id')
    .then((posts) => {
      res.payload = posts[0].photos[0].data
      next()
    })
    .catch(err => {
      console.log(err.errors);
      next(new Error(err));
    });
});

router.get('/:id', requireAuth, (req, res, next) => {
  Post.findById(req.params['id'])
    .then((post) => {
      res.payload = post
      next()
    })
    .catch(err => {
      console.log(err.errors);
      next(new Error(err));
    });
});

router.post('/:id/bid', requireAuth, (req, res, next) => {
  Post.addBid(req.params['id'], req.body)
    .then((post) => {
      res.payload = null;
      next();
    })
    .catch(err => {
      console.log(err.errors);
      next(new Error(err));
    });
});

router.post('/:id/questions', requireAuth, (req, res, next) => {
  let commentData = Object.assign({}, req.body, { userId: req.user._id });

  Post.addQuestion(req.params['id'], commentData)
    .then((post) => {
      res.payload = post.questions;
      next();
    })
    .catch(err => {
      console.log(err.errors);
      next(new Error(err));
    });
});

router.post('/:id/questions/:answerId/answer', requireAuth, (req, res, next) => {
  let answerData = Object.assign({}, req.body, { userId: req.user._id });

  Post.addAnswer(req.params['id'], req.params['answerId'], answerData)
    .then(() => {
      res.payload = {};
      next();
    })
    .catch(err => {
      console.log(err.errors);
      next(new Error(err));
    });
});
module.exports = router;

