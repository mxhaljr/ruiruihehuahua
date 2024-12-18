const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Birthday = require('../models/Birthday');

// 获取所有生日
router.get('/', authenticateToken, async (req, res) => {
    try {
        const birthdays = await Birthday.findAll({
            where: { user_id: req.user.id },
            order: [['birth_date', 'ASC']]
        });
        res.json(birthdays);
    } catch (error) {
        console.error('获取生日列表失败:', error);
        res.status(500).json({ message: '获取生日列表失败' });
    }
});

// 添加生日
router.post('/', authenticateToken, async (req, res) => {
    try {
        const birthdayData = {
            ...req.body,
            user_id: req.user.id
        };
        
        const birthday = await Birthday.create(birthdayData);
        res.status(201).json(birthday);
    } catch (error) {
        console.error('添加生日失败:', error);
        res.status(500).json({ message: '添加生日失败' });
    }
});

// 更新生日
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const [updated] = await Birthday.update(req.body, {
            where: { 
                id: req.params.id,
                user_id: req.user.id 
            }
        });

        if (updated) {
            const birthday = await Birthday.findOne({
                where: { 
                    id: req.params.id,
                    user_id: req.user.id 
                }
            });
            res.json(birthday);
        } else {
            res.status(404).json({ message: '生日不存在' });
        }
    } catch (error) {
        console.error('更新生日失败:', error);
        res.status(500).json({ message: '更新生日失败' });
    }
});

// 删除生日
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const deleted = await Birthday.destroy({
            where: { 
                id: req.params.id,
                user_id: req.user.id 
            }
        });

        if (deleted) {
            res.json({ message: '删除成功' });
        } else {
            res.status(404).json({ message: '生日不存在' });
        }
    } catch (error) {
        console.error('删除生日失败:', error);
        res.status(500).json({ message: '删除生日失败' });
    }
});

module.exports = router; 