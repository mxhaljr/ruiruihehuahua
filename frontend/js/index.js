document.addEventListener('DOMContentLoaded', async () => {
    try {
        const isLoggedIn = window.app.auth.isAuthenticated();
        const userInfo = window.app.auth.getUserInfo();
        
        const loginSection = document.getElementById('loginSection');
        const statsSection = document.getElementById('statsSection');
        const greetingText = document.getElementById('greetingText');

        if (isLoggedIn && userInfo) {
            if (loginSection) loginSection.style.display = 'none';
            if (statsSection) statsSection.style.display = 'block';
            
            if (greetingText) {
                const hour = new Date().getHours();
                let greeting = '';
                if (hour < 6) greeting = '夜深了，注意休息哦';
                else if (hour < 9) greeting = '早安，美好的一天开始啦';
                else if (hour < 12) greeting = '上午好，要开心哦';
                else if (hour < 14) greeting = '中午好，该休息啦';
                else if (hour < 17) greeting = '下午好，继续加油';
                else if (hour < 19) greeting = '傍晚好，该放松啦';
                else if (hour < 22) greeting = '晚上好，度过愉快的夜晚';
                else greeting = '夜深了，注意休息哦';
                
                greetingText.textContent = `${greeting}，${userInfo.username}`;
            }

            try {
                const headers = window.app.auth.getAuthHeaders();
                const [birthdays, anniversaries, countdowns] = await Promise.all([
                    fetch(`${window.app.apiBaseUrl}/birthdays`, { headers }).then(res => res.json()),
                    fetch(`${window.app.apiBaseUrl}/anniversaries`, { headers }).then(res => res.json()),
                    fetch(`${window.app.apiBaseUrl}/countdowns`, { headers }).then(res => res.json())
                ]);

                updateStats({
                    birthdayCount: birthdays.length || 0,
                    anniversaryCount: anniversaries.length || 0,
                    countdownCount: countdowns.length || 0
                });
            } catch {
                updateStats({
                    birthdayCount: 0,
                    anniversaryCount: 0,
                    countdownCount: 0
                });
            }
        } else {
            if (greetingText) {
                greetingText.textContent = '欢迎来到瑞瑞和华华';
            }
            if (loginSection) loginSection.style.display = 'block';
            if (statsSection) statsSection.style.display = 'none';
        }

        await loadNews();
    } catch {
        // 静默处理错误
    }
});

function updateStats(stats) {
    const { birthdayCount = 0, anniversaryCount = 0, countdownCount = 0 } = stats;
    
    const elements = {
        birthday: document.getElementById('birthdayCount'),
        anniversary: document.getElementById('anniversaryCount'),
        countdown: document.getElementById('countdownCount')
    };

    if (elements.birthday) elements.birthday.textContent = birthdayCount;
    if (elements.anniversary) elements.anniversary.textContent = anniversaryCount;
    if (elements.countdown) elements.countdown.textContent = countdownCount;
}

async function loadNews() {
    const newsListElement = document.getElementById('newsList');
    if (!newsListElement) return;

    try {
        newsListElement.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div></div>';

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
            newsListElement.innerHTML = '<div class="news-empty"><i class="fas fa-newspaper"></i><p>暂无新闻</p></div>';
        }
    } catch {
        newsListElement.innerHTML = '<div class="news-empty error"><i class="fas fa-exclamation-circle"></i><p>加载失败，请稍后重试</p></div>';
    }
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes}分钟前`;
    }
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}小时前`;
    }
    if (diff < 2592000000) {
        const days = Math.floor(diff / 86400000);
        return `${days}天前`;
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}