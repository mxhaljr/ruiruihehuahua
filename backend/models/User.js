const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const argon2 = require('argon2');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            len: [2, 20]
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [8, 100]
        }
    }
}, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: async (user) => {
            if (user.changed('password')) {
                console.log('加密密码 - beforeCreate');
                const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
                if (!passwordRegex.test(user.password)) {
                    throw new Error('密码必须至少包含8个字符，并包含字母、数字和特殊字符');
                }
                user.password = await argon2.hash(user.password);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                console.log('加密密码 - beforeUpdate');
                const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
                if (!passwordRegex.test(user.password)) {
                    throw new Error('密码必须至少包含8个字符，并包含字母、数字和特殊字符');
                }
                user.password = await argon2.hash(user.password);
            }
        }
    }
});

User.prototype.verifyPassword = async function(password) {
    try {
        return await argon2.verify(this.password, password);
    } catch (error) {
        console.error('密码验证失败:', error);
        return false;
    }
};

module.exports = User; 