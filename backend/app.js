const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const { sequelize, syncDatabase } = require('./models');

// 引入路由
const authRoutes = require('./routes/auth');
const birthdaysRoutes = require('./routes/birthdays');
const anniversariesRoutes = require('./routes/anniversaries');
const newsRoutes = require('./routes/news');
const countdownsRouter = require('./routes/countdowns');

const app = express();

// CORS 配置
app.use(cors({
    origin: [
        'http://localhost:5500', 
        'http://127.0.0.1:5500',
        'http://ruiruihehuahua.w1.luyouxia.net',
        'https://ruiruihehuahua.netlify.app'  // 添加 Netlify 域名
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
}));

// 中间件
app.use(express.json());

// API 状态检查路由
app.get('/api/status', (req, res) => {
    res.json({ status: 'online' });
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/birthdays', birthdaysRoutes);
app.use('/api/anniversaries', anniversariesRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/countdowns', countdownsRouter);

// 404 处理
app.use((req, res, next) => {
    res.status(404).json({
        message: '请求的资源不存在',
        path: req.path
    });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ 
        message: '服务器错误',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 测试数据库连接并同步模型
async function initializeDatabase() {
    try {
        // 测试数据库连接
        await sequelize.authenticate();
        console.log('数据库连接成功');
        
        // 同步数据库模型
        await syncDatabase();
        console.log('数据库初始化完成');
        
        return true;
    } catch (error) {
        console.error('数据库初始化失败:', error);
        
        // 在开发环境下，如果是严重错误就退出程序
        if (process.env.NODE_ENV === 'development') {
            console.error('严重错误，程序退出');
            process.exit(1);
        }
        
        return false;
    }
}

// 初始化数据库
initializeDatabase().then(success => {
    if (success) {
        // 启动服务器
        const port = config.app.port || 3000;
        app.listen(port, () => {
            console.log(`服务器运行在端口 ${port}`);
        });
    }
});

module.exports = app;