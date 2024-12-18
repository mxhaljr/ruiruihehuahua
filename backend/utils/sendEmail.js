const nodemailer = require('nodemailer');
const { getEmailTemplate } = require('../config/emailTemplates');

// 创建邮件发送器
const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    debug: true // 启用调试模式
});

// 验证邮件配置
async function verifyEmailConfig() {
    try {
        const result = await transporter.verify();
        console.log('邮件服务器连接成功:', result);
        return true;
    } catch (error) {
        console.error('邮件配置错误:', {
            message: error.message,
            code: error.code,
            command: error.command,
            stack: error.stack
        });
        return false;
    }
}

// 初始化时验证配置
verifyEmailConfig().then(isValid => {
    if (!isValid) {
        console.error('邮件服务初始化失败，请检查配置');
    }
});

const sendEmail = async (options) => {
    try {
        // 确保必要的参数存在
        if (!options.to || !options.subject) {
            throw new Error('邮件发送失败：缺少必要参数');
        }

        // 验证邮箱配置
        const isConfigValid = await verifyEmailConfig();
        if (!isConfigValid) {
            throw new Error('邮件服务配置无效');
        }

        console.log('准备发送邮件:', {
            to: options.to,
            subject: options.subject,
            from: process.env.EMAIL_USER
        });

        const mailOptions = {
            from: `"瑞瑞和华华的纪念日" <${process.env.EMAIL_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.html || options.text || ''
        };

        // 尝试发送邮件
        const info = await transporter.sendMail(mailOptions);
        console.log('邮件发送成功:', {
            messageId: info.messageId,
            response: info.response,
            accepted: info.accepted,
            rejected: info.rejected
        });

        return {
            success: true,
            messageId: info.messageId,
            response: info.response
        };
    } catch (error) {
        console.error('邮件发送失败:', {
            error: error.message,
            code: error.code,
            command: error.command,
            stack: error.stack
        });
        
        // 根据错误类型返回更具体的错误信息
        let errorMessage = '邮件发送失败';
        if (error.code === 'EAUTH') {
            errorMessage = '邮箱认证失败，请检查邮箱配置';
        } else if (error.code === 'ESOCKET') {
            errorMessage = '网络连接失败，请检查网络设置';
        } else if (error.code === 'EENVELOPE') {
            errorMessage = '邮件地址无效';
        }
        
        throw new Error(`${errorMessage}: ${error.message}`);
    }
};

module.exports = sendEmail; 