const User = require('../models/User');
const codeCache = require('../utils/codeCache');

const userController = {
    // 更换邮箱
    changeEmail: async (req, res) => {
        try {
            const { newEmail, code } = req.body;
            const userId = req.user.id;

            // 验证码校验
            const cacheData = codeCache.get(newEmail);
            if (!cacheData || cacheData.code !== code || cacheData.type !== 'changeEmail') {
                return res.status(401).json({ message: '验证码错误' });
            }

            // 更新邮箱
            await User.update({ email: newEmail }, { where: { id: userId } });
            
            res.json({ message: '邮箱更换成功' });
        } catch (error) {
            console.error('更换邮箱失败:', error);
            res.status(500).json({ message: '更换邮箱失败，请稍后重试' });
        }
    },

    // 注销登录
    logout: async (req, res) => {
        try {
            // 可以在这里处理token黑名单等逻辑
            res.json({ message: '注销成功' });
        } catch (error) {
            console.error('注销失败:', error);
            res.status(500).json({ message: '注销失败，请稍后重试' });
        }
    },

    // 删除账号
    deleteAccount: async (req, res) => {
        try {
            const { code } = req.body;
            const userId = req.user.id;

            // 验证码校验
            const cacheData = codeCache.get(req.user.email);
            if (!cacheData || cacheData.code !== code || cacheData.type !== 'deleteAccount') {
                return res.status(401).json({ message: '验证码错误' });
            }

            // 删除用户
            await User.destroy({ where: { id: userId } });
            
            res.json({ message: '账号已注销' });
        } catch (error) {
            console.error('删除账号失败:', error);
            res.status(500).json({ message: '删除账号失败，请稍后重试' });
        }
    }
};

module.exports = userController; 