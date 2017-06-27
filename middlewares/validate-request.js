const config = require('../config');

const validateRequest = function (req, res, next) {
  let appVersion = req.headers['app-version'];
  let regex = /^\d+\.\d+\.\d+$/g;
  appVersion = regex.test(appVersion) ? appVersion : false;
  let deviceId = req.headers['device-id'];
  let platform = req.headers.platform;

  // console.log(deviceId, appVersion, platform);
  let errors = [];

  if (req.originalUrl.indexOf('posts/photo/') === -1) {
    if (typeof deviceId == 'undefined' || deviceId === '') {
      errors.push('deviceId');
    }
    if (!appVersion) {
      errors.push('appVersion');
    }
    if (!config.platforms[platform]) {
      errors.push('platform');
    }
  }

  if (errors.length > 0) {
    let err = new Error('Invalid Request: ' + errors.join(','));
    err.status = 500;
    next(err);
  } else {
    req.appVersion = appVersion;
    req.deviceId = deviceId;
    req.platform = platform;
    next();
  }
};

module.exports = validateRequest;