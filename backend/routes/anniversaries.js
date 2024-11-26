const express = require('express');
const router = express.Router();
const Anniversary = require('../models/Anniversary');
const auth = require('../middleware/auth');

// 获取所有纪念日
router.get('/', auth, async (req, res) => {
    try {
        const anniversaries = await Anniversary.findAll(req.user.id);
        res.json(anniversaries);
    } catch (err) {
        console.error('查询失败:', err);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 获取单个纪念日
router.get('/:id', auth, async (req, res) => {
    try {
        const anniversary = await Anniversary.findById(req.params.id, req.user.id);
        if (!anniversary) {
            return res.status(404).json({ message: '未找到该纪念日' });
        }
        res.json(anniversary);
    } catch (err) {
        res.status(500).json({ message: '服务器错误' });
    }
});

// 添加新的纪念日
router.post('/', auth, async (req, res) => {
    try {
        const { title, date, type, description, reminder_days, important } = req.body;
        const anniversary = await Anniversary.create({
            title,
            date,
            type,
            description,
            reminder_days,
            important,
            user_id: req.user.id
        });
        res.status(201).json(anniversary);
    } catch (err) {
        console.error('创建失败:', err);
        res.status(400).json({ message: '创建失败' });
    }
});

// 更新纪念日
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, date, type, description, reminder_days, important } = req.body;
        const success = await Anniversary.update(req.params.id, req.user.id, {
            title,
            date,
            type,
            description,
            reminder_days,
            important
        });
        if (!success) {
            return res.status(404).json({ message: '未找到该纪念日' });
        }
        const updatedAnniversary = await Anniversary.findById(req.params.id, req.user.id);
        res.json(updatedAnniversary);
    } catch (err) {
        console.error('更新失败:', err);
        res.status(400).json({ message: '更新失败' });
    }
});

// 删除纪念日
router.delete('/:id', auth, async (req, res) => {
    try {
        const success = await Anniversary.delete(req.params.id, req.user.id);
        if (!success) {
            return res.status(404).json({ message: '未找到该纪念日' });
        }
        res.json({ message: '删除成功' });
    } catch (err) {
        res.status(500).json({ message: '删除失败' });
    }
});

// 获取即将到来的纪念日
router.get('/upcoming/:days', auth, async (req, res) => {
    try {
        const days = parseInt(req.params.days) || 30;
        const anniversaries = await Anniversary.findUpcoming(req.user.id, days);
        res.json(anniversaries);
    } catch (err) {
        res.status(500).json({ message: '查询失败' });
    }
});

// 获取指定月份的纪念日
router.get('/month/:month', auth, async (req, res) => {
    try {
        const month = parseInt(req.params.month);
        if (isNaN(month) || month < 1 || month > 12) {
            return res.status(400).json({ message: '无效的月份' });
        }
        const anniversaries = await Anniversary.findByMonth(req.user.id, month);
        res.json(anniversaries);
    } catch (err) {
        res.status(500).json({ message: '查询失败' });
    }
});

module.exports = router; 