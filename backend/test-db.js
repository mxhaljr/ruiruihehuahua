const sequelize = require('./config/database');

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('数据库连接成功！');
        
        // 测试查询
        const result = await sequelize.query('SELECT NOW()');
        console.log('当前数据库时间:', result[0][0].now);
        
    } catch (error) {
        console.error('数据库连接失败:', error);
    } finally {
        await sequelize.close();
    }
}

testConnection(); 