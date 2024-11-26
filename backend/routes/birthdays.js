const express = require('express');
const router = express.Router();
const Birthday = require('../models/Birthday');
const auth = require('../middleware/auth');

// 获取所有生日信息
router.get('/', auth, async (req, res) => {
    try {
        console.log('用户ID:', req.user.id);
        const birthdays = await Birthday.findAll(req.user.id);
        console.log('查询结果:', birthdays);
        res.json(birthdays);
    } catch (err) {
        console.error('查询失败:', err);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 获取单个生日信息
router.get('/:id', auth, async (req, res) => {
    try {
        const birthday = await Birthday.findById(req.params.id, req.user.id);
        if (!birthday) {
            return res.status(404).json({ message: '未找到该生日信息' });
        }
        res.json(birthday);
    } catch (err) {
        res.status(500).json({ message: '服务器错误' });
    }
});

// 添加新的生日信息
router.post('/', auth, async (req, res) => {
    try {
        const { name, birth_date, description, reminder_days, lunar } = req.body;
        const birthday = await Birthday.create({
            name,
            birth_date,
            description,
            reminder_days,
            lunar,
            user_id: req.user.id
        });
        res.status(201).json(birthday);
    } catch (err) {
        console.error('创建失败:', err);
        res.status(400).json({ message: '创建失败' });
    }
});

// 更新生日信息
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, birth_date, description, reminder_days, lunar } = req.body;
        const success = await Birthday.update(req.params.id, req.user.id, {
            name,
            birth_date,
            description,
            reminder_days,
            lunar
        });
        if (!success) {
            return res.status(404).json({ message: '未找到该生日信息' });
        }
        const updatedBirthday = await Birthday.findById(req.params.id, req.user.id);
        res.json(updatedBirthday);
    } catch (err) {
        console.error('更新失败:', err);
        res.status(400).json({ message: '更新失败' });
    }
});

// 删除生日信息
router.delete('/:id', auth, async (req, res) => {
    try {
        const success = await Birthday.delete(req.params.id, req.user.id);
        if (!success) {
            return res.status(404).json({ message: '未找到该生日信息' });
        }
        res.json({ message: '删除成功' });
    } catch (err) {
        res.status(500).json({ message: '删除失败' });
    }
});

module.exports = router; 