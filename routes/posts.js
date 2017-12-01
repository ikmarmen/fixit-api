const router = require("express").Router();
const multer = require("multer");
const Post = require("../models/post");
const User = require("../models/user");
const async = require("async");
const gm = require("gm");
const qs = require("qs");
const requireAuth = require("../middlewares/require-auth");
const mongoose = require("mongoose");

const fileUpload = multer();

const imageJob = (buffer, callback) => {
  let img = gm(buffer);
  img.size((err, size) => {
    if (!err) {
      let width = size.width / 2,
        height = size.height / 2;
      img
        .resize(size.width / 2, size.height / 2)
        .noProfile()
        .compress("JPEG")
        .toBuffer("JPEG", (err, buffer) => {
          err
            ? callback(err)
            : callback(null, { data: buffer, height: height, width: width });
        });
    } else {
      callback(err);
    }
  });
};

const processImages = files => {
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

const search = async request => {
  let query = Post;

  //Only requester user posts
  if (request.forRequester) {
    query = query.where({ userId: { $eq: request.userId } });
  }

  //Except requester user posts
  if (request.exceptRequester) {
    query = query.where({ userId: { $ne: request.userId } });
  }

  //Search by distance
  var lng = parseFloat(request.longitude);
  var lat = parseFloat(request.latitude);
  var maxDistance = parseFloat(request.maxDistance);
  if (lng && lat && maxDistance != null) {
    query = query.where({
      loc: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: maxDistance * 1000
        }
      }
    });
  }

  //Search by search keyword
  if (request.search) {
    query = query.where({ title: { $regex: request.search, $options: "si" } });
  }

  //Get post by this ID
  if (request.id) {
    query = query.where({ _id: request.id });
  }

  query = query.select({
    _id: 1,
    title: 1,
    description: 1,
    distance: 1,
    userId: 1,
    status: 1,
    updatedAt: 1,
    createdAt: 1,
    viewsCount: 1,
    "photos._id": 1,
    "questions._id": 1,
    "bids._id": 1
  });

  //Paging
  var skip = parseInt(request.skip);
  var take = parseInt(request.take);
  if (skip != null && take != null && !isNaN(skip) && !isNaN(take)) {
    query = query.skip(skip).limit(take);
  }

  //Ordering
  if (request.order) {
    let field;
    switch (request.order.by) {
      case "createdDate":
        field = "createdAt";
        break;
      case "distance":
        field = "distance";
        break;
      default:
        field = "createdAt";
    }
    if (request.order.direction !== "desc") {
      field = "-" + field;
    }

    query = query.sort(field);
  }

  let posts = await query.exec();

  //Get all unique user ids
  let userIds = [...new Set(posts.map(p => p.userId.toString()))];

  let users = await User.find({ _id: { $in: userIds } }, "_id name").exec();

  posts = posts.map(p => {
    let post = p.toObject();
    post.userName = users.find(u => u.id === post.userId.toString()).name;
    post.bidsCount = post.bids.length;
    post.questionsCount = post.questions.length;
    post.bids = null;
    post.questions = null;

    return post;
  });

  return posts;
};

router.post(
  "/",
  fileUpload.array("photos", 10),
  requireAuth,
  (req, res, next) => {
    processImages(req.files)
      .then(result => {
        let postData = Object.assign({}, req.body, {
          userId: req.user._id,
          photos: result
        });
        postData.status = "new";
        let post = new Post(postData);
        console.log("Start post saving.");

        post.save((err, result) => {
          if (err) {
            console.log(err.errors);
            next(new Error(err));
          } else {
            search({ id: result._id }).then(posts => {
              res.payload = posts[0];
              next();
            });
          }
        });
      })
      .catch(err => {
        console.log("err", err);
        next();
      });
  }
);

router.post("/search", requireAuth, (req, res, next) => {
  var request = qs.parse(req.body);
  request.userId = req.user._id;

  search(request)
    .then(posts => {
      res.payload = posts;
      next();
    })
    .catch(err => {
      console.log(err.message);
      next(new Error(err));
    });
});

router.get("/photo/:id", (req, res, next) => {
  Post.find(
    { "photos._id": req.params["id"] },
    { "photos.$": 1 },
    "photos.data, photos._id"
  )
    .then(posts => {
      res.payload = posts[0].photos[0].data;
      next();
    })
    .catch(err => {
      console.log(err.errors);
      next(new Error(err));
    });
});

router.get("/:id", requireAuth, (req, res, next) => {
  Post.findById(req.params["id"])
    .then(post => {
      res.payload = post;
      next();
    })
    .catch(err => {
      console.log(err.errors);
      next(new Error(err));
    });
});

router.post("/:id/questions", requireAuth, (req, res, next) => {
  let commentData = Object.assign({}, req.body, { userId: req.user._id });

  Post.addQuestion(req.params["id"], commentData)
    .then(post => {
      res.payload = post.questions;
      next();
    })
    .catch(err => {
      console.log(err.errors);
      next(new Error(err));
    });
});

router.post("/:id/questions/all", requireAuth, (req, res, next) => {
  Post.findOne({ _id: req.params["id"] })
    .select({ questions: 1 })
    .then(data => {
      res.payload = data.questions;
      next();
    })
    .catch(err => {
      console.log(err.errors);
      next(new Error(err));
    });
});

router.post(
  "/:id/questions/:questionId/answer",
  requireAuth,
  (req, res, next) => {
    let answerData = Object.assign({}, req.body, { userId: req.user._id });

    Post.addAnswer(req.params["id"], req.params["questionId"], answerData)
      .then(() => {
        res.payload = {};
        next();
      })
      .catch(err => {
        console.log(err.errors);
        next(new Error(err));
      });
  }
);

router.post("/:id/quotes", requireAuth, (req, res, next) => {
  let request = qs.parse(req.body);
  let bid = Object.assign({}, request, { userId: req.user._id });

  Post.addBid(req.params["id"], bid)
    .then(post => {
      res.payload = { success: true };
      next();
    })
    .catch(err => {
      console.log(err.errors);
      next(new Error(err));
    });
});

router.post("/:id/quotes/accept", requireAuth, (req, res, next) => {
  let request = qs.parse(req.body);

  /*   Post.addBid(req.params['id'], bid)
    .then((post) => {
      res.payload = { success: true };
      next();
    })
    .catch(err => {
      console.log(err.errors);
      next(new Error(err));
    }); */
});

router.post("/:id/quotes/all", requireAuth, (req, res, next) => {
  var aggregateArray = [
    {
      $lookup: {
        from: "users",
        localField: "bids.userId",
        foreignField: "_id",
        as: "createdBy"
      }
    },
    {
      $unwind: "$createdBy"
    },
    {
      $project: {
        bids: {
          _id: 1,
          message: 1,
          updatedAt: 1,
          createdAt: 1,
          contacts: 1,
          duration: 1,
          amount: 1,
          userId: 1,
          userName: "$createdBy.name"
        }
      }
    },
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.params["id"])
      }
    },
    {
      $sort: { "bids.createdAt": 1 }
    }
  ];
  Post.aggregate(aggregateArray)
    .then(data => {
      res.payload = data.length > 0 ? data[0].bids : [];
      next();
    })
    .catch(err => {
      console.log(err.errors);
      next(new Error(err));
    });
});
module.exports = router;
