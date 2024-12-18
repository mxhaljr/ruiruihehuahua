const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Birthday = sequelize.define('Birthday', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '生日ID'
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '用户ID'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: '姓名'
    },
    birth_date: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: '生日日期'
    },
    lunar: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否农历'
    },
    description: {
        type: DataTypes.TEXT,
        comment: '描述'
    },
    reminder_days: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '提前提醒天数'
    }
}, {
    tableName: 'birthdays',
    timestamps: true,
    underscored: true
});

module.exports = Birthday; 