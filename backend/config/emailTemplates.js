const getEmailTemplate = (type, code) => {
    const baseStyle = `
        <style>
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                font-family: 'Microsoft YaHei', Arial, sans-serif;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .title {
                color: #333;
                font-size: 24px;
                margin: 0;
                padding: 0;
            }
            .code-container {
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                margin: 20px 0;
                border-radius: 6px;
                border: 1px solid #e9ecef;
            }
            .code {
                font-size: 32px;
                font-weight: bold;
                color: #007bff;
                letter-spacing: 4px;
            }
            .message {
                color: #666;
                font-size: 16px;
                line-height: 1.6;
                margin: 20px 0;
            }
            .footer {
                color: #999;
                font-size: 14px;
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
            }
        </style>
    `;

    const templates = {
        register: {
            subject: '欢迎注册 - 验证码',
            html: `
                ${baseStyle}
                <div class="container">
                    <div class="header">
                        <h1 class="title">欢迎注册</h1>
                    </div>
                    <div class="message">
                        亲爱的用户，您好！<br>
                        感谢您注册我们的服务。请使用以下验证码完成注册：
                    </div>
                    <div class="code-container">
                        <div class="code">${code}</div>
                    </div>
                    <div class="message">
                        验证码15分钟内有效，请勿泄露给他人。<br>
                        如果这不是您的操作，请忽略此邮件。
                    </div>
                    <div class="footer">
                        此邮件由系统自动发送，请勿回复。
                    </div>
                </div>
            `
        },
        'reset-password': {
            subject: '重置密码 - 验证码',
            html: `
                ${baseStyle}
                <div class="container">
                    <div class="header">
                        <h1 class="title">重置密码</h1>
                    </div>
                    <div class="message">
                        您正在进行密码重置操作，请使用以下验证码：
                    </div>
                    <div class="code-container">
                        <div class="code">${code}</div>
                    </div>
                    <div class="message">
                        验证码10分钟内有效，请勿泄露给他人。<br>
                        如果这不是您的操作，请立即检查账号安全。
                    </div>
                    <div class="footer">
                        此邮件由系统自动发送，请勿回复。
                    </div>
                </div>
            `
        },
        'reset-email': {
            subject: '更换邮箱 - 验证码',
            html: `
                ${baseStyle}
                <div class="container">
                    <div class="header">
                        <h1 class="title">更换邮箱验证</h1>
                    </div>
                    <div class="message">
                        您正在进行邮箱更换操作，请使用以下验证码：
                    </div>
                    <div class="code-container">
                        <div class="code">${code}</div>
                    </div>
                    <div class="message">
                        验证码10分钟内有效，请勿泄露给他人。<br>
                        如果这不是您的操作，请立即检查账号安全。
                    </div>
                    <div class="footer">
                        此邮件由系统自动发送，请勿回复。
                    </div>
                </div>
            `
        },
        'delete-account': {
            subject: '账号注销 - 验证码',
            html: `
                ${baseStyle}
                <div class="container">
                    <div class="header">
                        <h1 class="title">账号注销验证</h1>
                    </div>
                    <div class="message">
                        您正在申请注销账号，请慎重考虑。如果确定要继续，请使用以下验证码：
                    </div>
                    <div class="code-container">
                        <div class="code">${code}</div>
                    </div>
                    <div class="message">
                        验证码10分钟内有效，请勿泄露给他人。<br>
                        注销后，您的所有数据将被永久删除且无法恢复。<br>
                        如果这不是您的操作，请立即检查账号安全。
                    </div>
                    <div class="footer">
                        此邮件由系统自动发送，请勿回复。
                    </div>
                </div>
            `
        }
    };

    return templates[type] || templates.register;
};

module.exports = {
    getEmailTemplate
}; 