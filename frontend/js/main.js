// 全局应用程序对象
window.app = {
    apiBaseUrl: 'http://localhost:3030/api'
};

// 检查是否需要登录 - 简化版本
function checkAuth() {
    const publicPages = ['login.html', 'register.html', 'forgot-password.html', 'index.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    if (!publicPages.includes(currentPage) && !localStorage.getItem('token')) {
        window.location.href = 'login.html';
    }
}

// 立即执行检查，不等待 DOMContentLoaded
checkAuth();