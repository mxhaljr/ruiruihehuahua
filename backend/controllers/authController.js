const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const validator = require('validator');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 验证邮箱格式
        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: '无效的邮箱格式' });
        }

        // 查找用户
        const [users] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: '用户不存在' });
        }

        const user = users[0];

        // 验证密码
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: '密码错误' });
        }

        // 生成 JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 返回用户信息和token
        res.json({
            message: '登录成功',
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username
            }
        });

    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ message: '登录失败' });
    }
};

exports.register = async (req, res) => {
    try {
        const { email, password, username, code } = req.body;

        // 验证邮箱格式
        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: '无效的邮箱格式' });
        }

        // 验证验证码
        const [verificationResult] = await db.query(
            'SELECT * FROM verification_codes WHERE email = ? AND code = ? AND type = ? AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE) ORDER BY created_at DESC LIMIT 1',
            [email, code, 'register']
        );

        if (!verificationResult.length) {
            return res.status(401).json({ message: '验证码无效或已过期' });
        }

        // 检查邮箱是否已注册
        const [existingUsers] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: '该邮箱已被注册' });
        }

        // 检查用户名是否已存在
        const [existingUsernames] = await db.query('SELECT * FROM Users WHERE username = ?', [username]);
        if (existingUsernames.length > 0) {
            return res.status(400).json({ message: '该用户名已被使用' });
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建用户
        const [result] = await db.query(
            'INSERT INTO Users (email, password, username) VALUES (?, ?, ?)',
            [email, hashedPassword, username]
        );

        // 生成 JWT token
        const token = jwt.sign(
            { id: result.insertId, email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: '注册成功',
            token,
            user: {
                id: result.insertId,
                email,
                username
            }
        });

    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({ message: '注册失败' });
    }
};

exports.verifyCode = async (req, res) => {
    try {
        const { email, code, type } = req.body;

        const [result] = await db.query(
            'SELECT * FROM verification_codes WHERE email = ? AND code = ? AND type = ? AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE) ORDER BY created_at DESC LIMIT 1',
            [email, code, type]
        );

        if (result.length === 0) {
            return res.status(400).json({ message: '验证码无效或已过期' });
        }

        res.json({ message: '验证码验证成功' });
    } catch (error) {
        console.error('验证码验证失败:', error);
        res.status(500).json({ message: '验证码验证失败' });
    }
};

exports.resetPassword = async (req, res) => {
    // ... 实现重置密码的逻辑
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, email } = req.body;
        
        // 确保 req.user 存在
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: '未授权的访问' });
        }
        
        const userId = req.user.id;

        // 验证用户
        const [users] = await db.query('SELECT * FROM Users WHERE id = ? AND email = ?', [userId, email]);
        if (users.length === 0) {
            return res.status(404).json({ message: '用户不存在' });
        }

        const user = users[0];

        // 验证当前密码
        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: '当前密码错误' });
        }

        // 加密新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 更新密码
        await db.query('UPDATE Users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ message: '密码修改成功' });

    } catch (error) {
        console.error('修改密码失败:', error);
        res.status(500).json({ message: '修改密码失败' });
    }
}; 