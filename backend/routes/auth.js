const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// 认证相关路由
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/reset-password', authController.resetPassword);
router.post('/change-password', authenticateToken, authController.changePassword);
router.post('/change-email', authenticateToken, authController.resetEmail);

// 发送验证码路由
router.post('/send-code', authController.sendCode);

// 注销账号路由
router.delete('/account', authController.deleteAccount);
router.post('/account/delete', authController.deleteAccount);

module.exports = router;