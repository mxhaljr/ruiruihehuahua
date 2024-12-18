class LoginManager {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.privacyCheckbox = document.getElementById('privacyCheckbox');
        this.loginButton = document.getElementById('loginButton');
        this.bindEvents();
        this.autoFillFromRegister();
    }

    autoFillFromRegister() {
        const registerEmail = sessionStorage.getItem('registerEmail');
        const registerPassword = sessionStorage.getItem('registerPassword');
        
        if (registerEmail && registerPassword) {
            // 填充表单
            document.getElementById('email').value = registerEmail;
            document.getElementById('password').value = registerPassword;
            
            // 自动勾选隐私政策
            if (this.privacyCheckbox) {
                this.privacyCheckbox.checked = true;
                this.loginButton.disabled = false;
                this.loginButton.style.opacity = '1';
            }
            
            // 清除存储的信息
            sessionStorage.removeItem('registerEmail');
            sessionStorage.removeItem('registerPassword');
        }
    }

    showAlert(options) {
        const { type = 'info', title, message, onConfirm } = options;
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert-modal ${type}`;
        alertDiv.innerHTML = `
            <div class="alert-content">
                <h3>${title}</h3>
                <p>${message}</p>
                <button class="alert-button">确定</button>
            </div>
        `;
        document.body.appendChild(alertDiv);
        
        const button = alertDiv.querySelector('button');
        button.onclick = () => {
            alertDiv.remove();
            if (onConfirm) {
                setTimeout(onConfirm, 100);
            }
        };
    }

    async handleLogin() {
        try {
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();

            // 表单验证
            if (!email || !password) {
                this.showAlert({
                    type: 'warning',
                    title: '提示',
                    message: '请填写所有必填项'
                });
                return;
            }

            // 验证邮箱格式
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                this.showAlert({
                    type: 'warning',
                    title: '提示',
                    message: '请输入有效的邮箱地址'
                });
                return;
            }

            // 显示加载状态
            this.loginButton.disabled = true;
            this.loginButton.textContent = '登录中...';

            console.log('开始登录请求:', { email });

            const response = await fetch(`${window.app.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();
            console.log('登录响应:', {
                status: response.status,
                ok: response.ok,
                data
            });

            if (response.ok) {
                // 保存认证信息
                window.app.auth.setToken(data.token);
                window.app.auth.setUserInfo(data.user);

                // 显示登录成功提示
                this.showAlert({
                    type: 'success',
                    title: '登录成功',
                    message: '即将跳转到首页',
                    onConfirm: () => {
                        // 直接跳转到首页
                        window.location.replace('index.html');
                    }
                });
            } else {
                throw new Error(data.message || '登录失败');
            }
        } catch (error) {
            console.error('登录失败:', error);
            this.showAlert({
                type: 'warning',
                title: '登录失败',
                message: error.message || '登录失败，请稍后重试'
            });
        } finally {
            // 恢复按钮状态
            this.loginButton.disabled = false;
            this.loginButton.textContent = '登录';
        }
    }

    bindEvents() {
        // 监听隐私政策复选框
        if (this.privacyCheckbox) {
            this.privacyCheckbox.addEventListener('change', () => {
                this.loginButton.disabled = !this.privacyCheckbox.checked;
                this.loginButton.style.opacity = this.privacyCheckbox.checked ? '1' : '0.5';
            });
        }

        // 监听表单提交
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('Login page loaded');
    new LoginManager();
}); 