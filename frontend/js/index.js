document.addEventListener('DOMContentLoaded', async () => {
    // 检查登录状态，但不强制跳转
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');

    // 加载新闻头条（无论是否登录都加载）
    await loadNews();
    // 设置30秒定时更新新闻
    const newsInterval = setInterval(() => {
        console.log('触发新闻更新...');
        loadNews();
    }, 30000);

    // 页面关闭时清理定时器
    window.addEventListener('beforeunload', () => {
        clearInterval(newsInterval);
    });

    // 根据登录状态调整界面显示
    if (token && email) {
        // 已登录状态
        document.getElementById('userEmail').textContent = email;
        document.getElementById('logoutBtn').style.display = 'block';
        try {
            // 并行获取所有数据
            const headers = {
                'Authorization': `Bearer ${token}`
            };
            
            const [birthdays, anniversaries, countdowns] = await Promise.all([
                fetch(`${window.app.apiBaseUrl}/birthdays`, { headers }).then(r => r.json()),
                fetch(`${window.app.apiBaseUrl}/anniversaries`, { headers }).then(r => r.json()),
                fetch(`${window.app.apiBaseUrl}/countdowns`, { headers }).then(r => r.json())
            ]);

            // 更新总数
            const totalCount = birthdays.length + anniversaries.length + countdowns.length;
            document.getElementById('totalBirthdays').textContent = totalCount;

            // 计算即将到来的事件（30天内）
            const today = new Date();
            const upcomingEvents = [
                ...birthdays.map(item => ({ date: new Date(item.birth_date), type: 'birthday' })),
                ...anniversaries.map(item => ({ date: new Date(item.date), type: 'anniversary' })),
                ...countdowns.map(item => ({ date: new Date(item.target_date), type: 'countdown' }))
            ].filter(item => {
                const daysUntil = getDateDiff(today, item.date);
                return daysUntil >= 0 && daysUntil <= 30;
            });

            document.getElementById('upcomingBirthdays').textContent = upcomingEvents.length;
        } catch (error) {
            console.error('加载数据失败:', error);
            document.getElementById('totalBirthdays').textContent = '0';
            document.getElementById('upcomingBirthdays').textContent = '0';
        }
    } else {
        // 未登录状态 - 显示登录/注册按钮
        const navbarNav = document.querySelector('.navbar-nav');
        const loginButtons = document.createElement('div');
        loginButtons.className = 'ms-auto d-flex align-items-center';
        loginButtons.innerHTML = `
            <a href="login.html" class="btn btn-outline-light">
                （登录/注册）
            </a>
        `;
        navbarNav.appendChild(loginButtons);
        // 显示示例数据
        displaySampleData();
    }

    // 设置问候语
    setGreeting();

    // 退出登录
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.clear();
        window.location.reload();
    });
});

// 新闻缓存
const newsCache = {
    data: null,
    timestamp: 0,
    cacheTime: 30 * 1000  // 30秒缓存时间
};

async function loadNews() {
    try {
        let allNews;
        const now = Date.now();
        console.log('检查新闻更新...', new Date().toLocaleTimeString());

        // 检查缓存是否有效
        if (newsCache.data && (now - newsCache.timestamp < newsCache.cacheTime)) {
            console.log('使用缓存的新闻数据');
            allNews = newsCache.data;
        } else {
            console.log('获取新的新闻数据');
            const response = await fetch(`${window.app.apiBaseUrl}/news`);
            if (!response.ok) {
                throw new Error('获取新闻失败');
            }
            allNews = await response.json();
            
            // 更新缓存
            newsCache.data = allNews;
            newsCache.timestamp = now;
            console.log('新闻数据已更新');
        }

        displayNews(allNews);
    } catch (error) {
        console.error('加载新闻失败:', error);
        displaySampleNews();
    }
}

function displayNews(allNews) {
    const newsContainer = document.getElementById('newsList');
    if (!newsContainer) return;

    // 收集所有新闻并按时间排序
    const allNewsItems = [];
    Object.entries(allNews).forEach(([source, newsArray]) => {
        if (Array.isArray(newsArray)) {
            allNewsItems.push(...newsArray);
        }
    });

    // 按发布时间排序
    allNewsItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // 只显示前6条新闻
    const newsToShow = allNewsItems.slice(0, 6);

    newsContainer.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h3 class="section-title">
                    <i class="fas fa-newspaper text-primary"></i>
                    今日头条
                </h3>
                <div class="row g-3">
                    ${newsToShow.map(news => `
                        <div class="col-md-6">
                            <a href="${news.link}" target="_blank" class="text-decoration-none">
                                <div class="news-item p-3 rounded">
                                    <h6 class="news-title text-dark mb-2">${news.title}</h6>
                                    <p class="news-content mb-2">${news.content}</p>
                                    <div class="news-meta">
                                        <small class="text-muted">
                                            <i class="fas fa-clock me-1"></i>${new Date(news.pubDate).toLocaleString()}
                                        </small>
                                        <small class="text-muted ms-2">
                                            <i class="fas fa-newspaper me-1"></i>${news.source}
                                        </small>
                                    </div>
                                </div>
                            </a>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function displaySampleNews() {
    const newsContainer = document.getElementById('newsList');
    if (!newsContainer) return;

    newsContainer.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h3 class="section-title">
                    <i class="fas fa-newspaper text-primary"></i>
                    今日头条
                </h3>
                <div class="text-center py-4">
                    <p class="text-muted">新闻加载中...</p>
                </div>
            </div>
        </div>
    `;
}