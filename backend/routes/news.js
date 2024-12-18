const express = require('express');
const router = express.Router();
const axios = require('axios');

// 新闻缓存
let newsCache = {
    data: null,
    timestamp: 0
};

// 缓存时间（5分钟）
const CACHE_DURATION = 5 * 60 * 1000;

// 新闻API配置
const NEWS_APIS = [
    {
        category: '要闻',
        url: 'https://i.news.qq.com/trpc.qqnews_web.kv_srv.kv_srv_http_proxy/list?sub_srv_id=24hours&srv_id=pc&offset=0&limit=100&strategy=1&ext={"pool":["top","hot"],"is_filter":7,"check_type":true}'
    },
    {
        category: '国内',
        url: 'https://i.news.qq.com/trpc.qqnews_web.kv_srv.kv_srv_http_proxy/list?sub_srv_id=news_news_internal&srv_id=pc&offset=0&limit=100&strategy=1&ext={"pool":["top","hot"],"is_filter":7,"check_type":true}'
    },
    {
        category: '娱乐',
        url: 'https://i.news.qq.com/trpc.qqnews_web.kv_srv.kv_srv_http_proxy/list?sub_srv_id=ent&srv_id=pc&offset=0&limit=100&strategy=1&ext={"pool":["top","hot"],"is_filter":7,"check_type":true}'
    }
];

// 获取新闻数据
async function fetchNewsData() {
    try {
        console.log('开始获取新闻数据...');
        const startTime = Date.now();

        const axiosConfig = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Referer': 'https://news.qq.com/'
            },
            timeout: 5000
        };

        const allNewsPromises = NEWS_APIS.map(api => 
            axios.get(api.url, axiosConfig)
                .then(res => ({
                    category: api.category,
                    data: res.data?.data?.list || []
                }))
                .catch(err => {
                    console.error(`获取${api.category}失败:`, err.message);
                    return null;
                })
        );

        const results = await Promise.all(allNewsPromises);
        console.log('新闻获取耗时:', Date.now() - startTime, 'ms');

        // 处理新闻数据
        const processNews = (newsData) => {
            if (!newsData || !Array.isArray(newsData.data)) {
                console.log(`${newsData?.category}数据无效`);
                return [];
            }

            console.log(`${newsData.category}原始数据条数:`, newsData.data.length);
            
            return newsData.data.map(item => {
                try {
                    // 处理时间
                    let newsTime;
                    if (item.publish_time) {
                        // 确保时间戳是数字且有效
                        const timestamp = parseInt(item.publish_time) * 1000;
                        if (!isNaN(timestamp)) {
                            newsTime = new Date(timestamp).toISOString();
                        } else {
                            newsTime = new Date().toISOString();
                        }
                    } else {
                        newsTime = new Date().toISOString();
                    }

                    return {
                        id: item.id || item.article_id || String(Date.now()),
                        title: item.title || '无标题',
                        link: item.url || '#',
                        time: newsTime,
                        content: item.abstract || item.summary || '暂无内容',
                        source: item.media_name || newsData.category,
                        image: item.img?.url || item.thumb_nail?.url_list?.[0] || null
                    };
                } catch (error) {
                    console.error('处理新闻数据时出错:', error);
                    console.error('问题数据:', JSON.stringify(item).slice(0, 200));
                    return null;
                }
            }).filter(Boolean); // 过滤掉处理失败的数据
        };

        // 合并所有新闻
        const allNews = results
            .filter(Boolean)
            .flatMap(processNews)
            .filter(news => news && news.title && news.time) // 确保必要字段存在
            .sort((a, b) => {
                try {
                    return new Date(b.time) - new Date(a.time);
                } catch {
                    return 0;
                }
            });

        console.log('合并后总新闻条数:', allNews.length);

        if (allNews.length === 0) {
            console.error('没有获取到任何新闻数据');
            return null;
        }

        return allNews;
    } catch (error) {
        console.error('获取新闻失败:', error);
        return null;
    }
}

// 定时更新新闻缓存
async function updateNewsCache() {
    console.log('=== 开始更新新闻缓存 ===');
    console.log('更新时间:', new Date().toISOString());
    
    const news = await fetchNewsData();
    if (news) {
        newsCache = {
            data: news,
            timestamp: Date.now()
        };
        console.log('新闻缓存更新成功');
    } else {
        console.error('新闻缓存更新失败');
    }
}

// 每小时更新一次新闻缓存
setInterval(updateNewsCache, 60 * 60 * 1000);

// 启动时先获取一次新闻
updateNewsCache();

router.get('/', async (req, res) => {
    try {
        console.log('=== 新闻接口请求开始 ===');
        console.log('请求IP:', req.ip);
        console.log('请求时间:', new Date().toISOString());

        // 检查缓存
        if (newsCache.data && (Date.now() - newsCache.timestamp) < CACHE_DURATION) {
            console.log('使用缓���数据');
            console.log('缓存时间:', new Date(newsCache.timestamp).toISOString());
            console.log('缓存数据条数:', newsCache.data.length);
            return res.json(newsCache.data);
        }

        // 重新获取新闻
        const news = await fetchNewsData();
        if (news) {
            newsCache = {
                data: news,
                timestamp: Date.now()
            };
            return res.json(news);
        }

        // 如果获取失败但有缓存，返回缓存
        if (newsCache.data) {
            console.log('获取失败，使用缓存数据');
            return res.json(newsCache.data);
        }

        // 都失败了返回加载状态
        return res.json([{
            id: 'loading',
            title: "新闻加载中...",
            link: "#",
            time: new Date().toISOString(),
            content: "正在获取最新新闻，请稍后刷新...",
            source: "系统提示",
            image: null
        }]);
    } catch (error) {
        console.error('新闻接口错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router; 