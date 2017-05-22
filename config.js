const Extend = require('extend');

const Config = {
  port: 4000,
  mongoUrl: 'mongodb://localhost:27017/fixit',
  imgHost: 'http://localhost:5000',

  platforms: {
    android: {
      url: '',
      liveAppVersion: '1.0.0',
      minAppVersion: '1.0.0',
      rating: {
        readCount: 3,
        startCount: 3,
        timeDiff: 1000 * 86400 * 2, //2 days
      },
    },

    ios: {
      url: '',
      liveAppVersion: '1.0.0',
      minAppVersion: '1.0.0',
      rating: {
        readCount: 3,
        startCount: 3,
        timeDiff: 1000 * 86400 * 2, //2 days
      },
    }
  },
};


if (process.env.NODE_ENV === 'production') {
  var prodConfig = require('./config.prod.json');
  Config = Extend(true, {}, Config, prodConfig);
}


module.exports = Config;