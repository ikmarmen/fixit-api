module.exports = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        var err = new Error('Unauthorized');
        err.status = 401;
        next(err);
    }
};