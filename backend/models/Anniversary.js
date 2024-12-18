const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Anniversary = sequelize.define('Anniversary', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '纪念日ID'
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '用户ID'
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: '标题'
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: '纪念日期'
    },
    type: {
        type: DataTypes.ENUM('love', 'wedding', 'work', 'other'),
        defaultValue: 'other',
        comment: '类型'
    },
    description: {
        type: DataTypes.TEXT,
        comment: '描述'
    },
    reminder_days: {
        type: DataTypes.INTEGER,
        defaultValue: 7,
        comment: '提前提醒天数'
    }
}, {
    tableName: 'anniversaries',
    timestamps: true,
    underscored: true
});

module.exports = Anniversary; 