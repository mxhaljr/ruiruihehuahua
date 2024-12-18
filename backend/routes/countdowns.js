const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Countdown = require('../models/Countdown');

// 获取所有倒计时
router.get('/', authenticateToken, async (req, res) => {
    try {
        const countdowns = await Countdown.findAll({
            where: { user_id: req.user.id },
            order: [['target_date', 'ASC']]
        });
        res.json(countdowns);
    } catch (error) {
        console.error('获取倒计时列表失败:', error);
        res.status(500).json({ message: '获取倒计时列表失败' });
    }
});

// 获取单个倒数日
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const countdown = await Countdown.findOne({
            where: { 
                id: req.params.id,
                user_id: req.user.id 
            }
        });

        if (countdown) {
            res.json(countdown);
        } else {
            res.status(404).json({ message: '倒数日不存在' });
        }
    } catch (error) {
        console.error('获取倒数日详情失败:', error);
        res.status(500).json({ message: '获取倒数日详情失败' });
    }
});

// 添加倒计时
router.post('/', authenticateToken, async (req, res) => {
    try {
        const countdownData = {
            ...req.body,
            user_id: req.user.id
        };
        
        const countdown = await Countdown.create(countdownData);
        res.status(201).json(countdown);
    } catch (error) {
        console.error('添加倒计时失败:', error);
        res.status(500).json({ message: '添加倒计时失败' });
    }
});

// 更新倒计时
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const [updated] = await Countdown.update(req.body, {
            where: { 
                id: req.params.id,
                user_id: req.user.id 
            }
        });

        if (updated) {
            const countdown = await Countdown.findOne({
                where: { 
                    id: req.params.id,
                    user_id: req.user.id 
                }
            });
            res.json(countdown);
        } else {
            res.status(404).json({ message: '倒计时不存在' });
        }
    } catch (error) {
        console.error('更新倒计时失败:', error);
        res.status(500).json({ message: '更新倒计时失败' });
    }
});

// 删除倒��时
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const deleted = await Countdown.destroy({
            where: { 
                id: req.params.id,
                user_id: req.user.id 
            }
        });

        if (deleted) {
            res.json({ message: '删除成功' });
        } else {
            res.status(404).json({ message: '倒计时不存在' });
        }
    } catch (error) {
        console.error('删除倒计时失败:', error);
        res.status(500).json({ message: '删除倒计时失败' });
    }
});

module.exports = router; 