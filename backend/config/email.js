const nodemailer = require('nodemailer');
require('dotenv').config();

// 创建邮件传输对象
const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,  // 使用 SSL
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS  // QQ邮箱的授权码
    }
});

// 测试邮件服务器连接
transporter.verify((error, success) => {
    if (error) {
        console.error('邮件服务器配置错误:', error);
    } else {
        console.log('邮件服务器连接成功!');
    }
});

// 验证码邮件模板
const getEmailTemplate = (type, code) => {
    let title = '';
    let action = '';
    let color = '';
    
    switch(type) {
        case 'register':
            title = '注册账号';
            action = '注册新账号';
            color = '#6B73FF';
            break;
        case 'reset':
            title = '重置密码';
            action = '重置密码';
            color = '#2196F3';
            break;
        case 'delete':
            title = '注销账号';
            action = '注销账号';
            color = '#dc3545';
            break;
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${title}验证码</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h2 style="color: white; margin: 0;">${title}验证码</h2>
                </div>
                <div style="background: #ffffff; padding: 20px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
                    <p style="color: #333;">您好！</p>
                    <p style="color: #333;">您正在${action}，请使用以下验证码完成操作：</p>
                    <div style="background: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
                        <span style="font-size: 24px; font-weight: bold; color: ${color}; letter-spacing: 5px;">${code}</span>
                    </div>
                    <p style="color: #666;">验证码有效期为10分钟，请尽快完成验证。</p>
                    <div style="background: #fff8f8; padding: 15px; border-radius: 5px; margin-top: 20px;">
                        <p style="color: #666; margin: 0 0 10px 0;">⚠️ 安全提醒：</p>
                        <ul style="color: #666; margin: 0; padding-left: 20px;">
                            <li>请勿将验证码泄露给他人</li>
                            <li>如果这不是您本人的操作，请忽略此邮件</li>
                        </ul>
                    </div>
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 12px; margin: 5px 0;">此邮件由系统自动发送，请勿回复</p>
                        <p style="color: #999; font-size: 12px; margin: 5px 0;">© 2024 生日提醒网站. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
};

// 发送邮件的通用函数
const sendEmail = async (to, subject, template) => {
    try {
        await transporter.sendMail({
            from: `"生日提醒" <${process.env.MAIL_USER}>`,
            to,
            subject,
            html: template
        });
        console.log('邮件发送成功:', { to, subject });
        return true;
    } catch (error) {
        console.error('邮件发送失败:', error);
        throw error;
    }
};

// 验证码邮件主题
const emailSubjects = {
    register: '注册验证码 - 生日提醒网站',
    reset: '重置密码验证码 - 生日提醒网站',
    delete: '注销账号验证码 - 生日提醒网站'
};

module.exports = {
    transporter,
    sendEmail,
    emailSubjects,
    getEmailTemplate
}; 