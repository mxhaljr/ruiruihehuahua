class ForgotPasswordManager {
    constructor() {
        this.form = document.getElementById('forgotForm');
        this.emailInput = document.getElementById('email');
        this.sendCodeBtn = document.getElementById('sendCode');
        this.verificationCodeSent = false;
        this.bindEvents();
        this.initializeState();
    }

    initializeState() {
        const lastSentTime = localStorage.getItem('verificationCodeSentTime');
        if (lastSentTime) {
            const elapsedSeconds = Math.floor((Date.now() - parseInt(lastSentTime)) / 1000);
            if (elapsedSeconds < 60) {
                this.startCountdown(60 - elapsedSeconds);
            }
        }

        const verifiedEmail = localStorage.getItem('verificationCodeEmail');
        if (verifiedEmail && this.emailInput) {
            this.emailInput.value = verifiedEmail;
            this.emailInput.readOnly = true;
            this.verificationCodeSent = this.getVerificationStatus();
        }
    }

    getVerificationStatus() {
        const lastSentTime = localStorage.getItem('verificationCodeSentTime');
        const verifiedEmail = localStorage.getItem('verificationCodeEmail');
        if (!lastSentTime || !verifiedEmail) return false;
        
        const isValid = (Date.now() - parseInt(lastSentTime)) < 10 * 60 * 1000;
        if (!isValid) {
            this.clearVerificationStatus();
        }
        return isValid;
    }

    clearVerificationStatus() {
        localStorage.removeItem('verificationCodeSentTime');
        localStorage.removeItem('verificationCodeEmail');
        if (this.emailInput) {
            this.emailInput.readOnly = false;
        }
        this.verificationCodeSent = false;
    }

    showAlert(message, type = 'error') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.left = '50%';
        alertDiv.style.transform = 'translateX(-50%)';
        alertDiv.style.padding = '15px 30px';
        alertDiv.style.borderRadius = '5px';
        alertDiv.style.backgroundColor = type === 'error' ? '#ff4444' : '#00C851';
        alertDiv.style.color = 'white';
        alertDiv.style.zIndex = '1000';
        alertDiv.textContent = message;

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }

    startCountdown(initialSeconds = 60) {
        let countdown = initialSeconds;
        this.sendCodeBtn.disabled = true;
        const timer = setInterval(() => {
            this.sendCodeBtn.textContent = `${countdown}秒后重试`;
            countdown--;
            if (countdown < 0) {
                clearInterval(timer);
                this.sendCodeBtn.disabled = false;
                this.sendCodeBtn.textContent = '获取验证码';
            }
        }, 1000);
    }

    async sendVerificationCode() {
        const email = this.emailInput.value.trim();
        if (!email) {
            this.showAlert('请输入邮箱地址');
            return;
        }

        try {
            this.sendCodeBtn.disabled = true;
            this.sendCodeBtn.textContent = '发送中...';

            const response = await fetch(`${window.app.apiBaseUrl}/auth/send-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    email,
                    type: 'reset-password'
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.verificationCodeSent = true;
                localStorage.setItem('verificationCodeSentTime', Date.now().toString());
                localStorage.setItem('verificationCodeEmail', email);
                this.emailInput.readOnly = true;
                this.showAlert('验证码已发送，请查收邮件', 'success');
                this.startCountdown();
            } else {
                throw new Error(data.message || '发送验证码失败');
            }
        } catch (error) {
            this.showAlert(error.message || '发送验证码失败，请重试');
            this.sendCodeBtn.disabled = false;
            this.sendCodeBtn.textContent = '获取验证码';
        }
    }

    checkPasswordStrength(password) {
        const checks = {
            length: password.length >= 8,
            hasLetter: /[a-zA-Z]/.test(password),
            hasNumber: /[0-9]/.test(password),
            hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        return {
            isValid: checks.length && checks.hasLetter && checks.hasNumber && checks.hasSymbol,
            checks
        };
    }

    async resetPassword(formData) {
        if (!this.verificationCodeSent) {
            this.showAlert('请先获取验证码');
            return;
        }

        const { email, code, password, confirmPassword } = formData;
        const storedEmail = localStorage.getItem('verificationCodeEmail');

        if (email !== storedEmail) {
            this.showAlert('邮箱地址与获取验证码时不一致');
            return;
        }

        if (!email || !code || !password || !confirmPassword) {
            this.showAlert('请填写所有必填项');
            return;
        }

        if (password !== confirmPassword) {
            this.showAlert('两次输入的密码不一致');
            return;
        }

        const passwordStrength = this.checkPasswordStrength(password);
        
        if (!passwordStrength.isValid) {
            this.showAlert('密码必须至少包含8个字符，并包含字母、数字和特殊字符');
            return;
        }

        try {
            const response = await fetch(`${window.app.apiBaseUrl}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    code,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.clearVerificationStatus();
                this.showAlert('密码重置成功，即将跳转到登录页面', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                throw new Error(data.message || '重置密码失败');
            }
        } catch (error) {
            if (error.message.includes('验证码无效或已过期')) {
                this.clearVerificationStatus();
            }
            this.showAlert(error.message || '重置密码失败，请重试');
        }
    }

    bindEvents() {
        if (this.sendCodeBtn) {
            this.sendCodeBtn.addEventListener('click', () => this.sendVerificationCode());
        }

        if (this.form) {
            this.form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = {
                    email: this.emailInput.value.trim(),
                    code: document.getElementById('code').value.trim(),
                    password: document.getElementById('password').value.trim(),
                    confirmPassword: document.getElementById('confirmPassword').value.trim()
                };
                await this.resetPassword(formData);
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ForgotPasswordManager();
}); 