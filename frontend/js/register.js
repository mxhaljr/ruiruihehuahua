console.log('register.js loaded');

// 注册函数
async function register(formData) {
    try {
        const response = await fetch(`${window.app.apiBaseUrl}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || '注册失败');
        }
        return data;
    } catch (error) {
        console.error('注册失败:', error);
        throw error;
    }
}

class RegisterManager {
    constructor() {
        this.form = document.getElementById('registerForm');
        this.passwordInput = document.getElementById('password');
        this.sendCodeBtn = document.getElementById('sendCode');
        this.bindEvents();
    }

    bindEvents() {
        // 监听密码输入
        this.passwordInput.addEventListener('input', (e) => {
            this.updatePasswordStrength(e.target.value);
        });

        // 发送验证码
        if (this.sendCodeBtn) {
            this.sendCodeBtn.addEventListener('click', async () => {
                const email = document.getElementById('email').value;
                if (!email) {
                    alert('请输入邮箱地址');
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
                            type: 'register'
                        })
                    });

                    const data = await response.json();

                    if (response.ok) {
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
                    } else {
                        throw new Error(data.message);
                    }
                } catch (error) {
                    alert(error.message || '发送验证码失败，请重试');
                    this.sendCodeBtn.disabled = false;
                    this.sendCodeBtn.textContent = '获取验证码';
                }
            });
        }

        // 表单提交
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegister();
        });
    }

    // 检查密码强度
    checkPasswordStrength(password) {
        let strength = 0;
        const checks = {
            length: password.length >= 8,
            hasLetter: /[a-zA-Z]/.test(password),
            hasNumber: /[0-9]/.test(password),
            hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        // 计算强度
        strength += checks.length ? 1 : 0;
        strength += checks.hasLetter ? 1 : 0;
        strength += checks.hasNumber ? 1 : 0;
        strength += checks.hasSymbol ? 1 : 0;

        return {
            score: strength,
            checks,
            level: strength === 4 ? 'strong' : strength >= 3 ? 'medium' : 'weak',
            isValid: strength >= 3 // 至少包含3种类型
        };
    }

    // 更新密码强度提示
    updatePasswordStrength(password) {
        const strengthResult = this.checkPasswordStrength(password);
        const strengthMeter = document.getElementById('passwordStrength');
        const strengthText = document.getElementById('strengthText');
        const strengthTips = document.getElementById('strengthTips');

        // 更新强度条
        strengthMeter.className = `strength-meter ${strengthResult.level}`;
        strengthMeter.style.width = `${(strengthResult.score / 4) * 100}%`;

        // 更新强度文本
        const levelText = {
            weak: '弱',
            medium: '中',
            strong: '强'
        };
        strengthText.textContent = levelText[strengthResult.level];
        strengthText.className = `strength-text ${strengthResult.level}`;

        // 更新提示信息
        let tips = [];
        if (!strengthResult.checks.length) tips.push('至少8个字符');
        if (!strengthResult.checks.hasLetter) tips.push('包含字母');
        if (!strengthResult.checks.hasNumber) tips.push('包含数字');
        if (!strengthResult.checks.hasSymbol) tips.push('包含特殊字符');

        strengthTips.textContent = tips.length ? `需要: ${tips.join(', ')}` : '密码强度良好';

        return strengthResult.isValid;
    }

    async handleRegister() {
        const formData = {
            email: document.getElementById('email').value.trim(),
            password: this.passwordInput.value.trim(),
            code: document.getElementById('code').value.trim(),
            username: document.getElementById('username').value.trim()
        };

        const confirmPassword = document.getElementById('confirmPassword').value.trim();

        // 验证密码强度
        if (!this.checkPasswordStrength(formData.password).isValid) {
            alert('密码必须包含字母、数字和特殊字符，且长度至少为8位');
            return;
        }

        // 验证两次密码是否一致
        if (formData.password !== confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }

        try {
            const data = await register(formData);
            alert('注册成功！');
            
            // 将注册信息存储到 sessionStorage，以便在登录页面使用
            sessionStorage.setItem('registerEmail', formData.email);
            sessionStorage.setItem('registerPassword', formData.password);
            
            window.location.href = 'login.html';
        } catch (error) {
            alert(error.message || '注册失败，请重试');
            if (error.message.includes('验证码已过期')) {
                document.getElementById('code').value = '';
            }
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new RegisterManager();
}); 