const router = require('express').Router();
const multer = require('multer');
const Post = require('../models/post');
const async = require('async');
const gm = require('gm');

const fileUpload = multer();

const imageJob = (buffer, callback) => {
    let img = gm(buffer);
    img.size((err, size) => {
        if (!err) {
            img.resize(size.width / 2, size.height / 2)
                .noProfile()
                .compress('JPEG')
                .toBuffer('JPEG', (err, buffer) => {
                    err ? callback(err) : callback(null, buffer);
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

router.post('/', fileUpload.array("photos", 10), (req, res, next) => {
    processImages(req.files)
        .then((result) => {
            let postData = Object.assign({}, req.body, {photos:result});
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

module.exports = router;

