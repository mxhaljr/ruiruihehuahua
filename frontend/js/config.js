// 配置对象
const CONFIG = {
    // API基础URL配置
    API_BASE_URL: 'http://localhost:3000/api',  // 直接使用本地开发环境的 URL
    encryptKey: 'your-secret-key-here'
};

// 定义认证相关方法
const auth = {
    getToken() {
        return localStorage.getItem('token');
    },
    setToken(token) {
        localStorage.setItem('token', token);
    },
    getUserInfo() {
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : null;
    },
    setUserInfo(info) {
        localStorage.setItem('userInfo', JSON.stringify(info));
    },
    clear() {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
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
    }
};

// 定义全局app对象
window.app = {
    // API基础地址
    apiBaseUrl: CONFIG.API_BASE_URL,
    encryptKey: CONFIG.encryptKey,
    auth: auth,  // 使用上面定义的 auth 对象
    
    // 检查页面认证状态
    checkPageAuth() {
        if (!this.auth.isAuthenticated()) {
            const currentUrl = window.location.href;
            sessionStorage.setItem('redirectUrl', currentUrl);
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }
};