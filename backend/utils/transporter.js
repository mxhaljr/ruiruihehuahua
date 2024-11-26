const nodemailer = require('nodemailer');
require('dotenv').config();

// 创建邮件发送器
const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    },
    debug: true  // 添加调试信息
});

// 测试邮件配置
transporter.verify(function (error, success) {
    if (error) {
        console.error('邮件服务配置错误:', error);
    } else {
        console.log('邮件服务器配置成功');
        // 发送测试邮件
        transporter.sendMail({
            from: process.env.MAIL_FROM,
            to: process.env.MAIL_USER,
            subject: '邮件服务测试',
            text: '如果您收到这封邮件，说明邮件服务配置成功。'
        }).then(() => {
            console.log('测试邮件发送成功');
        }).catch(err => {
            console.error('测试邮件发送失败:', err);
        });
    }
});

module.exports = transporter; 