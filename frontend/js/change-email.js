class EmailChangeManager {
    constructor() {
        this.form = document.getElementById('changeEmailForm');
        this.currentEmailInput = document.getElementById('currentEmail');
        this.newEmailInput = document.getElementById('newEmail');
        this.sendCodeBtn = document.getElementById('sendCode');
        this.passwordInput = document.getElementById('newPassword');
        this.codeInput = document.getElementById('code');
        
        // 检查必要的DOM元素
        if (!this.form || !this.currentEmailInput || !this.newEmailInput || 
            !this.sendCodeBtn || !this.passwordInput || !this.codeInput) {
            throw new Error('必要的DOM元素未找到');
        }

        this.init();
        this.bindEvents();
    }

    init() {
        // 不再检查登录状态
        // 直接初始化表单
        this.currentEmailInput.placeholder = '请输入当前邮箱';
    }

    bindEvents() {
        // 监听新邮箱输入
        this.newEmailInput.addEventListener('input', (e) => {
            this.updateEmailValidation(e.target.value);
        });

        // 发送验证码
        if (this.sendCodeBtn) {
            this.sendCodeBtn.addEventListener('click', async () => {
                try {
                    // 添加防��处理
                    if (this.sendCodeBtn.disabled) {
                        return;
                    }

                    const currentEmail = this.currentEmailInput.value.trim();
                    const newEmail = this.newEmailInput.value.trim();

                    // 验证新邮箱格式
                    if (!this.validateEmail(newEmail).isValid) {
                        this.showAlert({
                            type: 'warning',
                            title: '提示',
                            message: '请输入有效的新邮箱地址'
                        });
                        return;
                    }

                    // 证新旧邮箱不能相同
                    if (currentEmail === newEmail) {
                        this.showAlert({
                            type: 'warning',
                            title: '提示',
                            message: '新邮箱不能与当前邮箱相同'
                        });
                        return;
                    }

                    this.sendCodeBtn.disabled = true;
                    this.sendCodeBtn.textContent = '发送中...';

                    const response = await fetch(`${window.app.apiBaseUrl}/auth/send-code`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...window.app.auth.getAuthHeaders()  // 添加认证头
                        },
                        body: JSON.stringify({ 
                            email: newEmail,
                            type: 'reset-email'
                        })
                    });

                    if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.message || '发送验证码失败');
                    }

                    // 发送成功
                    this.showAlert({
                        type: 'success',
                        title: '发送成功',
                        message: '验证码已发送到新邮箱'
                    });

                    // 开始倒计时
                    let countdown = 60;
                    const timer = setInterval(() => {
                        this.sendCodeBtn.textContent = `${countdown}秒后重试`;
                        countdown--;
                        if (countdown < 0) {
                            clearInterval(timer);
                            this.sendCodeBtn.disabled = false;
                            this.sendCodeBtn.textContent = '获取验证码';
                        }
                    }, 1000);

                } catch (error) {
                    console.error('发送验证码失败:', error);
                    this.showAlert({
                        type: 'warning',
                        title: '发送失败',
                        message: error.message || '发送验证码失败，请稍后重试'
                    });
                    this.sendCodeBtn.disabled = false;
                    this.sendCodeBtn.textContent = '获取验证码';
                }
            });
        }

        // 表单提交
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleChangeEmail();
        });
    }

    validateEmail(email) {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const checks = {
            hasAt: email.includes('@'),
            hasDot: email.includes('.'),
            validFormat: regex.test(email),
            validLength: email.length >= 5 && email.length <= 50
        };

        return {
            isValid: Object.values(checks).every(v => v),
            checks
        };
    }

    updateEmailValidation(email) {
        const validationResult = this.validateEmail(email);
        const emailStrength = document.getElementById('emailStrength');
        const validationText = document.getElementById('validationText');
        const validationTips = document.getElementById('validationTips');

        // 更新验证条
        emailStrength.className = `validation-meter ${validationResult.isValid ? 'valid' : 'invalid'}`;

        // 更新验证文本
        validationText.textContent = validationResult.isValid ? '有效' : '无效';
        validationText.className = `validation-text ${validationResult.isValid ? 'valid' : 'invalid'}`;

        // 更新提示信息
        let tips = [];
        if (!validationResult.checks.hasAt) tips.push('需要包含@符号');
        if (!validationResult.checks.hasDot) tips.push('需要包含域名');
        if (!validationResult.checks.validLength) tips.push('长度在5-50个字符之间');
        if (!validationResult.checks.validFormat) tips.push('格式不正确');

        validationTips.textContent = tips.length ? `提示: ${tips.join(', ')}` : '邮箱格式正确';
    }

    showAlert(options) {
        const { type, title, message, confirmText = '确定', onConfirm } = options;

        const alertModal = document.createElement('div');
        alertModal.className = `alert-modal ${type ? 'alert-' + type : ''}`;
        
        alertModal.innerHTML = `
            <div class="alert-content">
                <div class="alert-icon">
                    ${type === 'success' ? '✓' : type === 'warning' ? '⚠' : 'ℹ'}
                </div>
                <h3 class="alert-title">${title}</h3>
                <p class="alert-message">${message}</p>
                <div class="alert-buttons">
                    <button class="alert-button alert-confirm">${confirmText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(alertModal);
        setTimeout(() => alertModal.classList.add('show'), 10);

        const confirmBtn = alertModal.querySelector('.alert-confirm');
        confirmBtn.onclick = () => {
            alertModal.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(alertModal);
                if (onConfirm) onConfirm();
            }, 300);
        };
    }

    async handleChangeEmail() {
        const currentEmail = this.currentEmailInput.value.trim();
        const newEmail = this.newEmailInput.value.trim();
        const code = this.codeInput.value.trim();
        const password = this.passwordInput.value.trim();

        // 验证当前邮箱
        const userInfo = window.app.auth.getUserInfo();
        if (currentEmail !== userInfo.email) {
            this.showAlert({
                type: 'warning',
                title: '提示',
                message: '当前邮箱输入错误'
            });
            return;
        }

        // 验证新邮箱格式
        if (!this.validateEmail(newEmail).isValid) {
            this.showAlert({
                type: 'warning',
                title: '提示',
                message: '请输入有效的邮箱地址'
            });
            return;
        }

        // 验证新旧邮箱不能相同
        if (currentEmail === newEmail) {
            this.showAlert({
                type: 'warning',
                title: '提示',
                message: '新邮箱不能与当前邮箱相同'
            });
            return;
        }

        // 添加验证码长度检查
        if (!code || code.length !== 6) {
            this.showAlert({
                type: 'warning',
                title: '提示', 
                message: '请输入6位���证码'
            });
            return;
        }

        // 添加密码长度检查
        if (!password || password.length < 6) {
            this.showAlert({
                type: 'warning',
                title: '提示',
                message: '密码不能少于6位'
            });
            return;
        }

        try {
            const response = await fetch(`${window.app.apiBaseUrl}/auth/change-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...window.app.auth.getAuthHeaders()
                },
                body: JSON.stringify({
                    currentEmail,
                    newEmail,
                    code,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert({
                    type: 'success',
                    title: '更换成功',
                    message: '邮箱已成功更换，请重新登录',
                    onConfirm: () => {
                        window.app.auth.clear();
                        window.location.href = 'login.html';
                    }
                });
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.showAlert({
                type: 'warning',
                title: '更换失败',
                message: error.message || '更换邮箱失败，请稍后重试'
            });
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    try {
        new EmailChangeManager();
    } catch (error) {
        console.error('EmailChangeManager 初始化失败:', error);
        // 显示错误提示
        const alertModal = document.createElement('div');
        alertModal.className = 'alert-modal alert-warning show';
        alertModal.innerHTML = `
            <div class="alert-content">
                <div class="alert-icon">⚠</div>
                <h3 class="alert-title">初始化失败</h3>
                <p class="alert-message">系统加载失败，请刷新页面重试</p>
                <div class="alert-buttons">
                    <button class="alert-button alert-confirm" onclick="location.reload()">刷新页面</button>
                </div>
            </div>
        `;
        document.body.appendChild(alertModal);
    }
}); 