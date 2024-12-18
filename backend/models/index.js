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
const syncDatabase = async () => {
    try {
        // 使用 force: true 来重新创建所有表
        await sequelize.sync({ force: true });
        console.log('数据库同步成功');
    } catch (error) {
        console.error('数据库同步失败:', error);
        throw error;
    }
};

// 导出模型和数据库实例
module.exports = {
    sequelize,
    Sequelize,
    syncDatabase,
    User,
    Anniversary,
    Countdown,
    VerificationCode
}; 