const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;  // 将用户信息添加到请求对象
            next();
        } catch (error) {
            console.error('Token 验证失败:', error);
            return res.status(401).json({ message: 'Token 无效或已过期' });
        }

    } catch (error) {
        console.error('认证中间件错误:', error);
        res.status(500).json({ message: '认证失败' });
    }
};

module.exports = authMiddleware; 