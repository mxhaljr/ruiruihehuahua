const VerificationCode = require('../models/VerificationCode');
const { Op } = require('sequelize');

// 存储验证码（后续可以改用 Redis）
const verificationCodes = new Map();

// 生成验证码
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 存储验证码
function storeCode(email, type) {
  const code = generateCode();
  verificationCodes.set(email, {
    code,
    type,
    expires: Date.now() + 5 * 60 * 1000 // 5分钟有效期
  });
  return code;
}

// 验证验证码
function verifyCode(email, code, type) {
  const storedData = verificationCodes.get(email);
  
  if (!storedData) {
    return { valid: false, message: '验证码不存在或已过期' };
  }

  if (Date.now() > storedData.expires) {
    verificationCodes.delete(email);
    return { valid: false, message: '验证码已过期' };
  }

  if (code !== storedData.code) {
    return { valid: false, message: '验证码错误' };
  }

  if (type && type !== storedData.type) {
    return { valid: false, message: '验证码类型不匹配' };
  }

  // 验证成功后删除验证码
  verificationCodes.delete(email);
  return { valid: true };
}

module.exports = {
  generateCode,
  storeCode,
  verifyCode
}; 