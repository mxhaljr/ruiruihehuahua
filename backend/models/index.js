const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// 导入模型
const User = require('./User');
const Birthday = require('./Birthday');
const Anniversary = require('./Anniversary');
const Countdown = require('./Countdown');
const VerificationCode = require('./VerificationCode');

// 初始化所有模型
const models = {
    User,
    Birthday,
    Anniversary,
    Countdown,
    VerificationCode
};

// 建立模型之间的关联关系
Object.values(models).forEach(model => {
    if (model.associate) {
        model.associate(models);
    }
});

// 同步数据库
async function syncDatabase() {
    try {
        // 在开发环境下使用 alter: true 来更新表结构
        if (process.env.NODE_ENV === 'development') {
            // 先禁用外键检查
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
            
            // 使用 alter 而不是 force，这样不会删除现有的表
            await sequelize.sync({ alter: true });
            
            // 重新启用外键检查
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
            
            console.log('数据库表结构已更新');
        } else {
            // 在生产环境下使用安全的同步方式
            await sequelize.sync();
            console.log('数据库同步成功');
        }
    } catch (error) {
        console.error('数据库同步失败:', error);
        // 确保在出错时也重新启用外键检查
        try {
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        } catch (e) {
            console.error('重新启用外键检查失败:', e);
        }
        throw error;
    }
}

// 导出模型和数据库实例
module.exports = {
    sequelize,
    syncDatabase,
    ...models
}; 