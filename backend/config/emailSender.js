const nodemailer = require('nodemailer');
const emailConfig = require('./email');
const { getEmailTemplate } = require('./emailTemplates');

const transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: true,
    auth: emailConfig.auth
});

async function sendEmail(options) {
    try {
        const mailOptions = {
            from: `"生日提醒" <${emailConfig.from}>`,
            ...options
        };
        return await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('邮件发送失败:', error);
        throw new Error('邮件发送失败，请稍后重试');
    }
}

module.exports = { sendEmail }; 