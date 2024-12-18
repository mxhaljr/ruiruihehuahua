class ProfileManager {
    constructor() {
        console.log('ProfileManager 初始化');
        // 获取当前页面路径
        const currentPage = window.location.pathname.split('/').pop();
        
        // 如果是注销页面，不初始化个人中心功能
        if (currentPage === 'delete-account.html') {
            return;
        }
        
        this.init();
        this.bindEvents();
    }

    init() {
        // 使用统一的认证检查方法
        if (!window.app.auth.isAuthenticated()) {
            console.log('未登录，跳转到登录页');
            window.location.href = 'login.html';
            return;
        }

        const userInfo = window.app.auth.getUserInfo();
        this.displayUserInfo(userInfo);
        this.loadStats();
    }

    displayUserInfo(userInfo) {
        const emailElement = document.getElementById('userEmail');
        if (emailElement) {
            emailElement.textContent = userInfo.username || userInfo.email || '-';
        }
    }

    async loadStats() {
        const elements = ['birthdayCount', 'anniversaryCount', 'countdownCount'];
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<span class="loading">加载中...</span>';
        });

        try {
            // 获取生日提醒数量
            const birthdayResponse = await fetch(`${window.app.apiBaseUrl}/birthdays`, {
                headers: window.app.auth.getAuthHeaders()
            });
            
            // 获取纪念日数量
            const anniversaryResponse = await fetch(`${window.app.apiBaseUrl}/anniversaries`, {
                headers: window.app.auth.getAuthHeaders()
            });
            
            // 获取倒数日数量
            const countdownResponse = await fetch(`${window.app.apiBaseUrl}/countdowns`, {
                headers: window.app.auth.getAuthHeaders()
            });

            if (birthdayResponse.ok && anniversaryResponse.ok && countdownResponse.ok) {
                const birthdayData = await birthdayResponse.json();
                const anniversaryData = await anniversaryResponse.json();
                const countdownData = await countdownResponse.json();

                // 更新显示数量
                this.animateNumber('birthdayCount', birthdayData.length || 0);
                this.animateNumber('anniversaryCount', anniversaryData.length || 0);
                this.animateNumber('countdownCount', countdownData.length || 0);
            }
        } catch (error) {
            console.error('获取统计数据失败:', error);
            elements.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = '<span class="error">加载失败</span>';
            });
        }
    }

    animateNumber(elementId, finalNumber) {
        const element = document.getElementById(elementId);
        const duration = 1000;
        const start = parseInt(element.textContent) || 0;
        const increment = (finalNumber - start) / (duration / 16);
        let current = start;
        
        const animate = () => {
            current += increment;
            if ((increment > 0 && current >= finalNumber) || 
                (increment < 0 && current <= finalNumber)) {
                element.textContent = finalNumber;
                return;
            }
            element.textContent = Math.round(current);
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    bindEvents() {
        // 退出登录
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAlert({
                    type: 'warning',
                    title: '确认退出',
                    message: '确定要退出登录吗？',
                    showCancel: true,
                    confirmText: '退出',
                    onConfirm: () => {
                        // 清除认证信息
                        window.app.auth.clear();
                        // 显示退出成功提示
                        this.showAlert({
                            type: 'success',
                            title: '退出成功',
                            message: '您已安全退出登录',
                            onConfirm: () => {
                                // 跳转到首页
                                window.location.href = 'index.html';
                            }
                        });
                    }
                });
            });
        }

        // 修改密码表单提交
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleChangePassword();
            });
        }

        // 监听新密码输入，实时显示密码强度
        const newPasswordInput = document.getElementById('newPassword');
        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', (e) => {
                this.updatePasswordStrength(e.target.value);
            });
        }
    }

    async handleChangePassword() {
        try {
            const currentPassword = document.getElementById('currentPassword').value.trim();
            const newPassword = document.getElementById('newPassword').value.trim();
            const confirmPassword = document.getElementById('confirmPassword').value.trim();

            // 表单验证
            const validations = [
                { condition: !currentPassword, message: '请输入当前密码' },
                { condition: !newPassword, message: '请输入新密码' },
                { condition: !confirmPassword, message: '请确认新密码' },
                { condition: newPassword !== confirmPassword, message: '两次输入的密码不一致' },
                { condition: !this.checkPasswordStrength(newPassword).isValid, 
                  message: '密码必须包含字母、数字和特殊字符，且长度至少为8位' },
                { condition: currentPassword === newPassword, message: '新密码不能与当前密码相同' }
            ];

            const error = validations.find(v => v.condition);
            if (error) {
                this.showAlert({
                    type: 'warning',
                    title: '提示',
                    message: error.message
                });
                return;
            }

            const response = await fetch(`${window.app.apiBaseUrl}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...window.app.auth.getAuthHeaders()
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || '修改密码失败');
            }

            // 显示修改成功提示，并提示用户重新登录
            this.showAlert({
                type: 'success',
                title: '修改成功',
                message: '密码已成功修改，请重新登录',
                onConfirm: () => {
                    // 清除当前登录状态
                    window.app.auth.clear();
                    // 关闭模态框
                    closePasswordModal();
                    // 跳转到登录页
                    window.location.href = 'login.html';
                }
            });
        } catch (error) {
            console.error('修改密码失败:', error);
            this.showAlert({
                type: 'warning',
                title: '修改失败',
                message: error.message || '修改密码失败，请重试'
            });
        }
    }

    // 显示提示框
    showAlert(options) {
        const { type, title, message, confirmText = '确定', showCancel = false, onConfirm, onCancel } = options;

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
                    ${showCancel ? `<button class="alert-button alert-cancel">取消</button>` : ''}
                    <button class="alert-button alert-confirm">${confirmText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(alertModal);
        setTimeout(() => alertModal.classList.add('show'), 10);

        const confirmBtn = alertModal.querySelector('.alert-confirm');
        const cancelBtn = alertModal.querySelector('.alert-cancel');

        confirmBtn.onclick = () => {
            alertModal.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(alertModal);
                if (onConfirm) onConfirm();
            }, 300);
        };

        if (cancelBtn) {
            cancelBtn.onclick = () => {
                alertModal.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(alertModal);
                    if (onCancel) onCancel();
                }, 300);
            };
        }
    }

    // 修改密码成功提示
    showPasswordChangeSuccess() {
        this.showAlert({
            type: 'success',
            title: '修改成功',
            message: '密码已成功修改'
        });
    }

    // 退出登录确认
    showLogoutConfirm() {
        this.showAlert({
            type: 'warning',
            title: '确认退出',
            message: '确定要退出登录吗？',
            showCancel: true,
            confirmText: '退出',
            onConfirm: () => {
                window.app.auth.clear();
                window.location.href = 'login.html';
            }
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
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'profile.html') {
        window.profileManager = new ProfileManager();
    }
});

// 模态框相关函数
window.showPasswordModal = () => {
    document.getElementById('passwordModal').classList.add('show');
    document.body.style.overflow = 'hidden';
};

window.closePasswordModal = () => {
    document.getElementById('passwordModal').classList.remove('show');
    document.body.style.overflow = '';
    document.getElementById('passwordForm').reset();
};
 