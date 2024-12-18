const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/User');
const codeCache = require('../utils/codeCache');
const VerificationCode = require('../models/VerificationCode');
const { Op } = require('sequelize');
const sendEmail = require('../utils/sendEmail');
const { getEmailTemplate } = require('../config/emailTemplates');

const authController = {
    register: async (req, res) => {
        try {
            const { email, password, username } = req.body;
            console.log('注册请求数据:', { email, username });

            // 检查邮箱是否已存在
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ message: '该邮箱已被注册' });
            }

            // 检查用户名是否已存在
            const existingUsername = await User.findOne({ where: { username } });
            if (existingUsername) {
                return res.status(400).json({ message: '该用户名已被使用' });
            }

            // 创建用户（密码会在 beforeCreate 钩子中自动加密）
            const user = await User.create({
                email,
                password,  // 直接使用原始密码，让模型的钩子处理加密
                username
            });

            // 生成 token
            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            // 返回成功信息
            res.status(201).json({
                message: '注册成功',
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username
                },
                token
            });

            console.log('注册成功:', { userId: user.id, email: user.email });

        } catch (error) {
            console.error('注册失败:', error);
            res.status(500).json({ 
                message: '注册失败，请稍后重试',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            console.log('收到登录请求:', { email });

            // 验证邮箱格式
            if (!validator.isEmail(email)) {
                return res.status(400).json({ message: '无效的邮箱格式' });
            }

            // 查找用户
            const user = await User.findOne({ where: { email }, attributes: ['id', 'email', 'password', 'username'] });
            console.log('查找用户结果:', { 
                found: !!user, 
                userId: user?.id,
                userEmail: user?.email,
                hasPassword: !!user?.password
            });

            if (!user) {
                return res.status(401).json({ message: '用户不存在' });
            }

            // 验证密码
            console.log('开始验证密码');
            try {
                const isPasswordValid = await argon2.verify(user.password, password);
                console.log('密码验证结果:', { isPasswordValid });

                if (!isPasswordValid) {
                    return res.status(401).json({ message: '密码错误' });
                }
            } catch (verifyError) {
                console.error('密码验证出错:', verifyError);
                return res.status(401).json({ message: '密码验证失败，请重试' });
            }

            // 生成 token
            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            // 返回用户信息和 token
            res.json({
                message: '登录成功',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username
                }
            });

            console.log('登录成功:', { userId: user.id, email: user.email });

        } catch (error) {
            console.error('登录失败:', error);
            res.status(500).json({ 
                message: '登录失败，请重试',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    resetPassword: async (req, res) => {
        try {
            const { email, code, password } = req.body;
            console.log('重置密码请求:', { email, code });

            // 验证新密码强度
            const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
            if (!passwordRegex.test(password)) {
                return res.status(400).json({ 
                    message: '新密码必须至少包含8个字符，并包含字母、数字和特殊字符'
                });
            }

            // 从数据库中查找验证码记录
            const verificationCode = await VerificationCode.findOne({
                where: {
                    email,
                    code,
                    type: 'reset-password',
                    used: false,
                    expires_at: { [Op.gt]: new Date() }
                }
            });

            console.log('数据库中的验证码记录:', verificationCode);

            if (!verificationCode) {
                return res.status(401).json({ message: '验证码无效或已过期' });
            }

            // 查找用户
            const user = await User.findOne({ 
                where: { email },
                attributes: ['id', 'email', 'password', 'username']
            });

            if (!user) {
                return res.status(404).json({ message: '用户不存在' });
            }

            // 手动加密新密码
            const hashedPassword = await argon2.hash(password);

            // 直接更新密码，跳过模型钩子
            await User.update(
                { password: hashedPassword },
                { where: { id: user.id }, individualHooks: false }
            );

            // 标记验证码为已使用
            await verificationCode.update({ used: true });

            // 清除缓存中的验证码（如果有）
            codeCache.delete(email);

            // 记录密码重置日志
            console.log('密码重置成功:', { userId: user.id, email: user.email });

            res.json({ message: '密码重置成功' });
        } catch (error) {
            console.error('重置密码失败:', error);
            res.status(500).json({ 
                message: '重置密码失败，请稍后重试',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            
            // 确保 req.user 存在
            if (!req.user || !req.user.id) {
                return res.status(401).json({ message: '未授权的访问' });
            }

            // 验证新密码强度
            const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
            if (!passwordRegex.test(newPassword)) {
                return res.status(400).json({ 
                    message: '新密码必须至少包含8个字符，并包含字母、数字和特殊字符' 
                });
            }

            // 使用 Sequelize 查找用户
            const user = await User.findOne({ 
                where: { 
                    id: req.user.id 
                },
                attributes: ['id', 'email', 'password', 'username']
            });

            if (!user) {
                return res.status(404).json({ message: '用户不存在' });
            }

            // 验证当前密码
            const validPassword = await argon2.verify(user.password, currentPassword);
            if (!validPassword) {
                return res.status(401).json({ message: '当前密码错误' });
            }

            // 手动加密新密码
            const hashedPassword = await argon2.hash(newPassword);

            // 直接更新密码，跳过模型钩子
            await User.update(
                { password: hashedPassword },
                { where: { id: user.id }, individualHooks: false }
            );

            // 记录密码更新日志
            console.log('密码修改成功:', { userId: user.id, email: user.email });

            res.json({ message: '密码修改成功' });

        } catch (error) {
            console.error('修改密码失败:', error);
            res.status(500).json({ message: '修改密码失败，请稍后重试' });
        }
    },

    deleteAccount: async (req, res) => {
        try {
            const { email, code } = req.body;
            console.log('注销账号请求:', { email });

            // 验证用户是否存在
            const user = await User.findOne({ 
                where: { email },
                attributes: ['id', 'email']
            });

            if (!user) {
                return res.status(404).json({ message: '用户不存在' });
            }

            // 验证验证码
            const verificationCode = await VerificationCode.findOne({
                where: {
                    email,
                    code,
                    type: 'delete-account',
                    used: false,
                    expires_at: { [Op.gt]: new Date() }
                }
            });

            console.log('验证码记录:', verificationCode);

            if (!verificationCode) {
                return res.status(401).json({ message: '验证码无效或已过期' });
            }

            // 标记验证码为已使用
            await verificationCode.update({ used: true });

            // 删除用户
            await User.destroy({
                where: { id: user.id }
            });

            res.json({ message: '账号注销成功' });

        } catch (error) {
            console.error('注销账号失败:', error);
            res.status(500).json({ 
                message: '注销账号失败，请稍后重试',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    sendCode: async (req, res) => {
        try {
            const { email, type } = req.body;
            console.log('发送验证码请求:', { email, type });

            // 验证邮箱格式
            if (!email || !validator.isEmail(email)) {
                return res.status(400).json({ message: '请输入有效的邮箱地址' });
            }

            // 检查验证码类型
            const validTypes = ['register', 'reset-password', 'reset-email', 'delete-account'];
            if (!validTypes.includes(type)) {
                return res.status(400).json({ message: '无效的验证码类型' });
            }

            // 如果是注销账户，检查用户是否存在
            if (type === 'delete-account') {
                const user = await User.findOne({ where: { email } });
                if (!user) {
                    return res.status(404).json({ message: '该邮箱未注册' });
                }
            }

            // 生成验证码
            const code = Math.random().toString().slice(2, 8);
            console.log('生成的验证码:', code);

            try {
                // 获取对应的邮件模板
                const template = getEmailTemplate(type, code);

                // 发送邮件
                const emailResult = await sendEmail({
                    to: email,
                    subject: template.subject,
                    html: template.html
                });

                console.log('邮件发送结果:', emailResult);

                // 保存验证码到数据库
                await VerificationCode.destroy({ 
                    where: { 
                        email,
                        type,
                        used: false
                    } 
                });

                await VerificationCode.create({
                    email,
                    code,
                    type,
                    expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10分钟有效期
                });

                res.json({ 
                    message: '验证码已发送',
                    success: true
                });
            } catch (emailError) {
                console.error('邮件发送失败:', emailError);
                res.status(500).json({ 
                    message: emailError.message || '验证码发送失败，请重试',
                    success: false
                });
            }
        } catch (error) {
            console.error('验证码发送失败:', error);
            res.status(500).json({ 
                message: '验证码发送失败，请重试',
                success: false,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    resetEmail: async (req, res) => {
        try {
            const { currentEmail, newEmail, code, password } = req.body;

            // 验证当前邮箱是否存在
            const user = await User.findOne({ where: { email: currentEmail } });
            if (!user) {
                return res.status(400).json({ message: '当前邮箱不存在' });
            }

            // 验证密码
            const isValidPassword = await argon2.verify(user.password, password);
            if (!isValidPassword) {
                return res.status(400).json({ message: '密码错误' });
            }

            // 验证新邮箱是否已被使用
            const emailExists = await User.findOne({ where: { email: newEmail } });
            if (emailExists) {
                return res.status(400).json({ message: '该邮箱已被使用' });
            }

            // 验证验证码
            const verificationCode = await VerificationCode.findOne({
                where: {
                    email: newEmail,
                    code,
                    type: 'reset-email',
                    used: false,
                    expires_at: { [Op.gt]: new Date() }
                }
            });

            if (!verificationCode) {
                return res.status(400).json({ message: '验证码无效或已过期' });
            }

            // 更新邮箱
            await user.update({ email: newEmail });
            await verificationCode.update({ used: true });

            res.json({ message: '邮箱更换成功' });
        } catch (error) {
            console.error('更换邮箱失败:', error);
            res.status(500).json({ message: '更换邮箱失败，请重试' });
        }
    }
};

module.exports = authController; 