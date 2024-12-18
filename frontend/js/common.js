// 通用页面加载管理
class PageManager {
    constructor() {
        this.showLoading();
        this.init();
    }

    async init() {
        try {
            await this.initPage();
        } finally {
            this.hideLoading();
        }
    }

    async initPage() {
        // 子类实现具体逻辑
    }

    showLoading() {
        document.body.classList.add('is-loading');
    }

    hideLoading() {
        document.body.classList.remove('is-loading');
    }

    handleError(error) {
        if (window.app && window.app.auth && window.app.auth.showAlert) {
            window.app.auth.showAlert({
                type: 'error',
                title: '错误',
                message: error.message || '操作失败，请重试'
            });
        } else {
            alert(error.message || '操作失败，请重试');
        }
    }
}

// 如果window.app不存在，初始化它
if (!window.app) {
    window.app = {
        apiBaseUrl: 'http://localhost:3000/api',
        auth: {
            getToken() {
                return localStorage.getItem('token');
            },
            setToken(token) {
                localStorage.setItem('token', token);
            },
            getUserInfo() {
                const info = localStorage.getItem('userInfo');
                return info ? JSON.parse(info) : null;
            },
            setUserInfo(info) {
                localStorage.setItem('userInfo', JSON.stringify(info));
            },
            clear() {
                localStorage.removeItem('token');
                localStorage.removeItem('userInfo');
            },
            getAuthHeaders() {
                const token = this.getToken();
                return token ? {
                    'Authorization': `Bearer ${token}`
                } : {};
            },
            isAuthenticated() {
                const token = this.getToken();
                const userInfo = this.getUserInfo();
                return !!(token && userInfo);
            },
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
                    if (onConfirm) onConfirm();
                };
            }
        }
    };
}