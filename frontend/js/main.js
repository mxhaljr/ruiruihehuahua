// API 请求工具函数
async function apiRequest(url, options = {}) {
    const token = window.app.auth.getToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        }
    };

    const response = await fetch(
        `${window.app.apiBaseUrl}${url}`,
        { ...defaultOptions, ...options }
    );

    if (response.status === 401) {
        window.app.auth.logout();
        return;
    }

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || '请求失败');
    }

    return data;
}

// 检查登录状态
function checkAuth() {
    if (!window.app.auth.isAuthenticated()) {
        window.location.href = 'login.html';
    }
}

// 在需要认证的页面添加
document.addEventListener('DOMContentLoaded', checkAuth);

// 基础功能初始化
document.addEventListener('DOMContentLoaded', async () => {
    // 设置问候语
    setGreeting();
    
    // 检查登录状态
    checkLoginStatus();
    
    // 加载新闻
    await loadNews();
});

// 设置问候语
function setGreeting() {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour < 6) {
        greeting = '夜深了，注意休息哦！';
    } else if (hour < 9) {
        greeting = '早安，美好的一天开始啦！';
    } else if (hour < 12) {
        greeting = '上午好，要开心哦！';
    } else if (hour < 14) {
        greeting = '中午好，该休息啦！';
    } else if (hour < 17) {
        greeting = '下午好，继续加油！';
    } else if (hour < 19) {
        greeting = '傍晚好，该放松啦！';
    } else if (hour < 22) {
        greeting = '晚上好，度过愉快的夜晚！';
    } else {
        greeting = '夜深了，注意休息哦！';
    }

    const greetingText = document.getElementById('greetingText');
    if (greetingText) {
        greetingText.textContent = greeting;
    }
}

// 检查登录状态
function checkLoginStatus() {
    const loginSection = document.getElementById('loginSection');
    const isLoggedIn = window.app.auth.isAuthenticated();
    
    if (loginSection) {
        loginSection.style.display = isLoggedIn ? 'none' : 'block';
    }
}

// 加载新闻
async function loadNews() {
    const newsListElement = document.getElementById('newsList');
    if (!newsListElement) return;

    try {
        const response = await fetch(`${window.app.apiBaseUrl}/news`);
        const news = await response.json();

        if (news && news.length > 0) {
            newsListElement.innerHTML = news.map(item => `
                <div class="news-card">
                    ${item.image ? `<img src="${item.image}" alt="${item.title}" class="news-image">` : ''}
                    <div class="news-content-wrapper">
                        <h3 class="news-title">${item.title}</h3>
                        <p class="news-content">${item.content}</p>
                        <div class="news-footer">
                            <span class="news-source">${item.source}</span>
                            <span class="news-time">${formatTime(item.time)}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            newsListElement.innerHTML = '<div class="no-news">暂无新闻</div>';
        }
    } catch (error) {
        console.error('加载新闻失败:', error);
        newsListElement.innerHTML = '<div class="error-message">加载新闻失败，请稍后重试</div>';
    }
}

// 格式化时间
function formatTime(timeStr) {
    const date = new Date(timeStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}