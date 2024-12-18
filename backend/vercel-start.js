// 设置生产环境
process.env.NODE_ENV = 'production';

// 导入应用
const app = require('./app');

// 启动服务器
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`服务器运行在端口 ${port}`);
}); 