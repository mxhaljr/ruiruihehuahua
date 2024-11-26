const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        console.log('收到的token:', token);
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('解析的用户信息:', decoded);
        
        req.user = decoded;
        next();
    } catch (err) {
        console.error('认证失败:', err);
        res.status(401).json({ message: '请先登录' });
    }
};

module.exports = auth; 