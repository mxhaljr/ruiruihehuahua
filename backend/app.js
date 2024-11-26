const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
require('dotenv').config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 添加请求日志中间件
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// 静态文件服务
app.use(express.static(path.join(__dirname, '../frontend')));

// API 路由
app.use('/api', routes);

const anniversariesRouter = require('./routes/anniversaries');
app.use('/api/anniversaries', anniversariesRouter);

const countdownsRouter = require('./routes/countdowns');
app.use('/api/countdowns', countdownsRouter);

// 添加新闻路由
const newsRouter = require('./routes/news');
app.use('/api/news', newsRouter);

// 404 处理
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        console.log('API 404:', req.path);
        res.status(404).json({ message: '接口不存在' });
    } else {
        next();
    }
});

// 所有其他请求返回 index.html
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('错误:', err.stack);
    res.status(500).json({ message: '服务器内部错误' });
});

// 启动服务器
const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('API 基础路径:', '/api');
});

module.exports = app;