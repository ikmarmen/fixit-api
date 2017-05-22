module.exports = (err, req, res, next) => {
  if (req.app.get('env') === 'production') {
    res.status(err.status || 500);
    res.send({
      message: err.message,
      error: err
    });
  } else {
    err.debug = {
      status: err.status,
      trace: err.stack
    };
    res.status(err.status || 500);
    res.send({
      message: err.message,
      error: err.debug
    });
  }
};