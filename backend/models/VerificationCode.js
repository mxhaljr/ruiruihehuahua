const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VerificationCode = sequelize.define('VerificationCode', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['register', 'reset-password', 'reset-email', 'delete-account']]
        }
    },
    used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'verification_codes',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            name: 'verification_codes_email_type_idx',
            fields: ['email', 'type']
        },
        {
            name: 'verification_codes_expires_at_idx',
            fields: ['expires_at']
        }
    ]
});

module.exports = VerificationCode; 