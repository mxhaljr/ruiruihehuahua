const express = require('express');
const router = express.Router();
const Countdown = require('../models/Countdown');
const auth = require('../middleware/auth');

// 获取未来的倒数日
router.get('/future', auth, async (req, res) => {
    try {
        const countdowns = await Countdown.findFuture(req.user.id);
        res.json(countdowns);
    } catch (err) {
        res.status(500).json({ message: '查询失败' });
    }
});

// 获取已过期的倒数日
router.get('/past', auth, async (req, res) => {
    try {
        const countdowns = await Countdown.findPast(req.user.id);
        res.json(countdowns);
    } catch (err) {
        res.status(500).json({ message: '查询失败' });
    }
});

// 获取即将到来的倒数日
router.get('/upcoming/:days', auth, async (req, res) => {
    try {
        const days = parseInt(req.params.days) || 30;
        const countdowns = await Countdown.findUpcoming(req.user.id, days);
        res.json(countdowns);
    } catch (err) {
        res.status(500).json({ message: '查询失败' });
    }
});

// 获取所有倒数日
router.get('/', auth, async (req, res) => {
    try {
        const countdowns = await Countdown.findAll(req.user.id);
        res.json(countdowns);
    } catch (err) {
        console.error('查询失败:', err);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 获取单个倒数日
router.get('/:id', auth, async (req, res) => {
    try {
        const countdown = await Countdown.findById(req.params.id, req.user.id);
        if (!countdown) {
            return res.status(404).json({ message: '未找到该倒数日' });
        }
        res.json(countdown);
    } catch (err) {
        res.status(500).json({ message: '服务器错误' });
    }
});

// 添加新的倒数日
router.post('/', auth, async (req, res) => {
    try {
        const { title, target_date, description } = req.body;
        const countdown = await Countdown.create({
            title,
            target_date,
            description,
            user_id: req.user.id
        });
        res.status(201).json(countdown);
    } catch (err) {
        console.error('创建失败:', err);
        res.status(400).json({ message: '创建失败' });
    }
});

// 更新倒数日
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, target_date, description } = req.body;
        const success = await Countdown.update(req.params.id, req.user.id, {
            title,
            target_date,
            description
        });
        if (!success) {
            return res.status(404).json({ message: '未找到该倒数日' });
        }
        const updatedCountdown = await Countdown.findById(req.params.id, req.user.id);
        res.json(updatedCountdown);
    } catch (err) {
        console.error('更新失败:', err);
        res.status(400).json({ message: '更新失败' });
    }
});

// 删除倒数日
router.delete('/:id', auth, async (req, res) => {
    try {
        const success = await Countdown.delete(req.params.id, req.user.id);
        if (!success) {
            return res.status(404).json({ message: '未找到该倒数日' });
        }
        res.json({ message: '删除成功' });
    } catch (err) {
        res.status(500).json({ message: '删除失败' });
    }
});

module.exports = router; 