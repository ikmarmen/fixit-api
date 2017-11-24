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
      err ? reject(err) : resolve(result);
    });
    //runs in series (each job will wait until the previews one is done)
    // async.series(jobs, (err) => {
    //   err ? reject() : resolve();
    // });
  });

};

router.post('/', fileUpload.array("photos", 10), requireAuth, (req, res, next) => {
  processImages(req.files)
    .then((result) => {
      let postData = Object.assign({}, req.body, { userId: req.user._id, photos: result });
      postData.status = 'new';
      let post = new Post(postData)
      console.log("Start post saving.");

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
  var matchArray = [];
  if (request.forRequester) {
    matchArray.push({ 'userId': { '$eq': req.user._id } });
  }

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

  aggregateArray.push(
    {
      $unwind: {
        path: "$questions",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind: {
        path: "$bids",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup:
        {
          from: "users",
          localField: "questions.userId",
          foreignField: "_id",
          as: "questions.createdBy"
        }
    },
    {
      $lookup:
        {
          from: "users",
          localField: "bids.userId",
          foreignField: "_id",
          as: "bids.createdBy"
        }
    },
    {
      $lookup:
        {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "createdBy"
        }
    },
    {
      $unwind: "$createdBy"
    },
    {
      $unwind: "$photos"
    },
    {
      $group: {
        "_id": "$_id",
        "title": { "$first": "$title" },
        "description": { "$first": "$description" },
        "createdAt": { "$first": "$createdAt" },
        "viewsCount": { "$first": "$viewsCount" },
        "userId": { "$first": "$userId" },
        "createdBy": { "$first": "$createdBy.name" },
        "photos": { "$push": { "_id": "$photos._id" } },
        "distance": { "$first": "$dist" },
        "status": { "$first": "$status" },
        "viewsCount": { "$first": "52" },
        "questions": {
          "$push": {
            "_id": "$questions._id",
            "body": "$questions.body",
            "createdAt": "$questions.createdAt",
            "answer": "$questions.answer",
            "createdBy": { "$arrayElemAt": ["$questions.createdBy.name", 0] }
          }
        },
        "bids": {
          "$push": {
            "_id": "$bids._id",
            "message": "$bids.message",
            "updatedAt": "$bids.updatedAt",
            "createdAt": "$bids.createdAt",
            "contacts": "$bids.contacts",
            "duration": "$bids.duration",
            "amount": "$bids.amount",
            "createdBy": { "$arrayElemAt": ["$bids.createdBy.name", 0] }
          }
        }
      }
    }
  );

  //Search by search keyword
  if (request.search) {
    matchArray.push({ 'title': { '$regex': request.search, $options: 'si' } })
    //aggregateArray.push({ '$match': { 'title': { '$regex': request.search, $options: 'si' } } });
  }
  if (matchArray.length > 0) {
    aggregateArray.push({ '$match': { '$and': matchArray } });
  }
  //Order resault
  if (request.order) {
    var sort = {};
    var direction = request.order.direction == 'desc' ? 1 : -1;
    if (request.order.by == 'createdDate') {
      sort.createdAt = direction;
    } else if (request.order.by == 'distanse') {
      sort.distance = direction;
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

  Post.aggregate(aggregateArray).then((posts) => {
    //Ugly hack, for excluding aggregation result empty objects
    posts.map((post, index, array) => {
      if (!post.questions[0]._id) {
        array[index].questions = [];
      }
      if (!post.bids[0]._id) {
        array[index].bids = [];
      }
    })
    res.payload = posts;
    next()
  })
    .catch(err => {
      console.log(err.message);
      next(new Error(err));
    });
});

router.post('/allNew', requireAuth, (req, res, next) => {
  var request = qs.parse(req.body);

  var aggregateArray = [];
  var matchArray = [];
  if (request.forRequester) {
    matchArray.push({ 'userId': { '$eq': req.user._id } });
  }

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

  aggregateArray.push(
    {
      $lookup:
        {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "createdBy"
        }
    },
    {
      $unwind: "$createdBy"
    },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        distance: "$dist" ,
        userId: 1,
        userName: "$createdBy.name",  
        status: 1 ,
        updatedAt: 1 ,
        createdAt: 1 ,
        viewsCount: 1 ,
        photos: "$photos._id",
        questionsCount: {$size: "$questions"},
        bidsCount: {$size: "$bids"}
      }
    }
  );

  //Search by search keyword
  if (request.search) {
    matchArray.push({ 'title': { '$regex': request.search, $options: 'si' } })
    //aggregateArray.push({ '$match': { 'title': { '$regex': request.search, $options: 'si' } } });
  }
  if (matchArray.length > 0) {
    aggregateArray.push({ '$match': { '$and': matchArray } });
  }
  //Order resault
  if (request.order) {
    var sort = {};
    var direction = request.order.direction == 'desc' ? 1 : -1;
    if (request.order.by == 'createdDate') {
      sort.createdAt = direction;
    } else if (request.order.by == 'distanse') {
      sort.distance = direction;
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

  Post.aggregate(aggregateArray).then((posts) => {
    res.payload = posts;
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

router.post('/:id/quote', requireAuth, (req, res, next) => {
  let request = qs.parse(req.body);
  let bid = Object.assign({}, request, { userId: req.user._id });

  Post.addBid(req.params['id'], bid)
    .then((post) => {
      res.payload = { success: true };
      next();
    })
    .catch(err => {
      console.log(err.errors);
      next(new Error(err));
    });
});

router.post('/:id/questions/:questionId/answer', requireAuth, (req, res, next) => {
  let answerData = Object.assign({}, req.body, { userId: req.user._id });

  Post.addAnswer(req.params['id'], req.params['questionId'], answerData)
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

