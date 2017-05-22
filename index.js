const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const app = express();

const config = require('./config');

app.use(logger(app.get('env') === 'production' ? 'combined' : 'dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(require('./middlewares/validate-request'));

app.use('/startup', require('./routes/startup'));

app.use(function (req, res, next) {
  if (typeof res.payload !== 'undefined') {
    // set timeout can be used to test slow connections
    // setTimeout(() => {
    res.send(res.payload);
    // }, 1000);
  } else {
    next();
  }
});

app.use(require('./middlewares/404'));
app.use(require('./middlewares/error'));

app.listen(config.port, () => {
  let appPackage = require('./package.json');
  console.log('[' + appPackage.name + '] is listening on port ' + config.port + '!');
});

