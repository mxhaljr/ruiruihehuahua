const express = require('express');
const router = express.Router();
const Parser = require('rss-parser');
const parser = new Parser({
    customFields: {
        item: [
            ['description', 'content']
        ]
    }
});

// 使用新浪新闻 API 和其他可用的 RSS 源
const NEWS_APIS = {
    sina: {
        url: 'https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2509&k=&num=20&page=1',
        async fetch() {
            const response = await fetch(this.url);
            const data = await response.json();
            return data.result.data.map(item => ({
                title: item.title,
                link: item.url,
                pubDate: new Date(item.ctime * 1000).toISOString(),
                content: item.intro || item.title,
                source: '新浪'
            }));
        }
    },
    people: {
        url: 'http://www.people.com.cn/rss/politics.xml',
        async fetch() {
            const feed = await parser.parseURL(this.url);
            return feed.items.map(item => ({
                title: item.title,
                link: item.link,
                pubDate: new Date(item.pubDate).toISOString(),
                content: item.content || item.description || item.title,
                source: '人民网'
            }));
        }
    },
    chinanews: {
        url: 'http://www.chinanews.com/rss/scroll-news.xml',
        async fetch() {
            const feed = await parser.parseURL(this.url);
            return feed.items.map(item => ({
                title: item.title,
                link: item.link,
                pubDate: new Date(item.pubDate).toISOString(),
                content: item.content || item.description || item.title,
                source: '中新网'
            }));
        }
    },
    tech: {
        url: 'https://36kr.com/api/newsflash',
        async fetch() {
            const response = await fetch(this.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            const data = await response.json();
            return data.data.items.map(item => ({
                title: item.title,
                link: `https://36kr.com/newsflashes/${item.id}`,
                pubDate: new Date(item.published_at).toISOString(),
                content: item.description || item.title,
                source: '科技'
            }));
        }
    },
    world: {
        url: 'https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2510&k=&num=20&page=1',
        async fetch() {
            const response = await fetch(this.url);
            const data = await response.json();
            return data.result.data.map(item => ({
                title: item.title,
                link: item.url,
                pubDate: new Date(item.ctime * 1000).toISOString(),
                content: item.intro || item.title,
                source: '国际'
            }));
        }
    }
};

// 添加错误重试机制
async function fetchWithRetry(fetcher, retries = 3) {
    let lastError;
    
    for (let i = 0; i < retries; i++) {
        try {
            return await fetcher();
        } catch (error) {
            lastError = error;
            console.warn(`重试第 ${i + 1} 次...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // 递增延迟
        }
    }
    
    throw lastError;
}

// 获取所有新闻
router.get('/', async (req, res) => {
    try {
        const allNews = {};
        console.log('\n=== 开始获取新闻 ===');
        
        // 并行获取所有新闻源
        const promises = Object.entries(NEWS_APIS).map(async ([source, api]) => {
            try {
                console.log(`\n[${source}] 开始获取新闻...`);
                console.log(`[${source}] 请求URL:`, api.url);
                
                // 使用重试机制
                const newsItems = await fetchWithRetry(() => api.fetch());
                allNews[source] = newsItems;
                
                console.log(`[${source}] 获取成功:`, {
                    数量: newsItems.length,
                    示例新闻: newsItems.length > 0 ? {
                        标题: newsItems[0].title,
                        链接: newsItems[0].link,
                        时间: newsItems[0].pubDate,
                        来源: newsItems[0].source
                    } : '无新闻'
                });
            } catch (error) {
                console.error(`[${source}] 获取失败:`, {
                    错误: error.message,
                    堆栈: error.stack
                });
                allNews[source] = [];
            }
        });

        await Promise.all(promises);
        
        // 打印汇总信息
        console.log('\n=== 新闻获取汇总 ===');
        const summary = Object.entries(allNews).map(([source, news]) => ({
            source,
            count: news.length
        }));
        
        console.table(summary);
        
        const totalNews = Object.values(allNews).reduce((sum, news) => sum + news.length, 0);
        console.log(`\n总新闻数: ${totalNews} 条`);
        
        // 检查是否有新闻源获取失败
        const failedSources = summary.filter(s => s.count === 0).map(s => s.source);
        if (failedSources.length > 0) {
            console.warn('\n警告: 以下新闻源获取失败:', failedSources);
        }

        res.json(allNews);
    } catch (error) {
        console.error('\n获取新闻失败:', {
            错误: error.message,
            堆栈: error.stack
        });
        res.status(500).json({ message: '获取新闻失败' });
    }
});

module.exports = router; 