const config = require('../config');

const validateRequest = function (req, res, next) {
  let appVersion = req.headers['app-version'];
  let regex = /^\d+\.\d+\.\d+$/g;
  appVersion = regex.test(appVersion) ? appVersion : false;
  let uuid = req.headers.uuid;
  let platform = req.headers.platform;

  // console.log(uuid, appVersion, platform);
  let errors = [];

  if (typeof uuid == 'undefined' || uuid === '') {
    errors.push('uuid');
  }
  if (!appVersion) {
    errors.push('appVersion');
  }
  if (!config.platforms[platform]) {
    errors.push('platform');
  }

  if (errors.length > 0) {
    let err = new Error('Invalid Request: ' + errors.join(','));
    err.status = 500;
    next(err);
  } else {
    req.appVersion = appVersion;
    req.uuid = uuid;
    req.platform = platform;
    next();
  }
};

module.exports = validateRequest;