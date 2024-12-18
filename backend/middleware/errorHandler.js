module.exports = (err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || '服务器内部错误';

    res.status(status).json({
        error: {
            message,
            status
        }
    });
}; 