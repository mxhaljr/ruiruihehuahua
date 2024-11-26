const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validator = require('validator');
const bcrypt = require('bcrypt');
const db = require('../database/db');
const emailConfig = require('../config/email');  // 引入 email 配置
const authenticateToken = require('../middleware/authenticateToken');

// 登录
router.post('/login', authController.login);

// 注册
router.post('/register', authController.register);

// 发送验证码
router.post('/send-code', async (req, res) => {
    try {
        const { email, type } = req.body;
        
        console.log('收到验证码请求:', { email, type });

        // 验证邮箱
        if (!email || !validator.isEmail(email)) {
            console.log('邮箱验证失败:', email);
            return res.status(400).json({ message: '无效的邮箱地址' });
        }

        // 验证类型
        const validTypes = ['register', 'reset', 'delete'];
        if (!type || !validTypes.includes(type)) {
            console.log('验证码类型无效:', type);
            return res.status(400).json({ message: '无效的验证码类型' });
        }

        // 生成验证码
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('生成的验证码:', verificationCode);

        try {
            // 将验证码保存到数据库
            await db.query(
                'INSERT INTO verification_codes (email, code, type, created_at) VALUES (?, ?, ?, NOW())',
                [email, verificationCode, type]
            );
            console.log('验证码已保存到数据库');

            // 使用 getEmailTemplate 函数生成邮件内容
            const template = emailConfig.getEmailTemplate(type, verificationCode);
            const subject = emailConfig.emailSubjects[type];

            // 发送验证码邮件
            await emailConfig.sendEmail(email, subject, template);
            
            console.log('验证码邮件已发送');
            res.json({ message: '验证码已发送' });

        } catch (error) {
            console.error('操作失败:', error);
            throw error;
        }

    } catch (error) {
        console.error('发送验证码失败:', error);
        res.status(500).json({ 
            message: '发送验证码失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// 验证验证码
router.post('/verify-code', authController.verifyCode);

// 重置密码
router.post('/reset-password', async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { email, code, newPassword } = req.body;

        // 验证验证码
        const [verificationResult] = await connection.query(
            'SELECT * FROM verification_codes WHERE email = ? AND code = ? AND type = ? AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE) ORDER BY created_at DESC LIMIT 1',
            [email, code, 'reset']
        );

        if (!verificationResult.length) {
            await connection.release();
            return res.status(401).json({ message: '验证码无效或已过期' });
        }

        // 对新密码进行加密
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 更新用户密码
        const [updateResult] = await connection.query(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, email]
        );

        if (updateResult.affectedRows === 0) {
            await connection.release();
            return res.status(404).json({ message: '用户不存在' });
        }

        // 删除已使用的验证码
        await connection.query(
            'DELETE FROM verification_codes WHERE email = ? AND type = ?',
            [email, 'reset']
        );

        await connection.release();
        res.json({ message: '密码重置成功' });

    } catch (error) {
        console.error('重置密码失败:', error);
        if (connection) {
            await connection.release();
        }
        res.status(500).json({ message: '重置密码失败，请稍后重试' });
    }
});

// 修改密码
router.post('/change-password', authenticateToken, authController.changePassword);

// 处理账号注销
router.post('/delete-account', authenticateToken, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        const { email, password, code, type } = req.body;
        const userId = req.user.id;

        // 验证用户身份
        const [users] = await connection.query('SELECT * FROM users WHERE id = ? AND email = ?', [userId, email]);
        if (!users.length) {
            await connection.release();
            return res.status(404).json({ message: '用户不存在' });
        }

        // 验证密码
        const validPassword = await bcrypt.compare(password, users[0].password);
        if (!validPassword) {
            await connection.release();
            return res.status(401).json({ message: '密码错误' });
        }

        // 验证验证码
        const [verificationResult] = await connection.query(
            'SELECT * FROM verification_codes WHERE email = ? AND code = ? AND type = ? AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE) ORDER BY created_at DESC LIMIT 1',
            [email, code, type]
        );

        if (!verificationResult.length) {
            await connection.release();
            return res.status(401).json({ message: '验证码无效或已过期' });
        }

        // 开始事务
        await connection.beginTransaction();

        try {
            // 删除用户的生日提醒
            await connection.query('DELETE FROM birthdays WHERE user_id = ?', [userId]);
            
            // 删除用户的纪念日
            await connection.query('DELETE FROM anniversaries WHERE user_id = ?', [userId]);
            
            // 删除用户的倒数日
            await connection.query('DELETE FROM life_day WHERE user_id = ?', [userId]);
            
            // 删除验证码记录
            await connection.query('DELETE FROM verification_codes WHERE email = ?', [email]);
            
            // 最后删除用户账号
            await connection.query('DELETE FROM users WHERE id = ?', [userId]);
            
            // 提交事务
            await connection.commit();
            
            // 释放连接
            await connection.release();
            
            res.json({ message: '账号已成功注销' });
        } catch (error) {
            // 如果出错，回滚事务
            await connection.rollback();
            await connection.release();
            throw error;
        }

    } catch (error) {
        console.error('注销账号失败:', error);
        // 确保连接被释放
        if (connection) {
            await connection.release();
        }
        res.status(500).json({ message: '注销账号失败' });
    }
});

module.exports = router; 