const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Anniversary = require('../models/Anniversary');

// 获取所有纪念日
router.get('/', authenticateToken, async (req, res) => {
    try {
        const anniversaries = await Anniversary.findAll({
            where: { user_id: req.user.id },
            order: [['date', 'ASC']]
        });
        res.json(anniversaries);
    } catch (error) {
        console.error('获取纪念日列表失败:', error);
        res.status(500).json({ message: '获取纪念日列表失败' });
    }
});

// 添加纪念日
router.post('/', authenticateToken, async (req, res) => {
    try {
        const anniversaryData = {
            ...req.body,
            user_id: req.user.id
        };
        
        const anniversary = await Anniversary.create(anniversaryData);
        res.status(201).json(anniversary);
    } catch (error) {
        console.error('添加纪念日失败:', error);
        res.status(500).json({ message: '添加纪念日失败' });
    }
});

// 更新纪念日
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const [updated] = await Anniversary.update(req.body, {
            where: { 
                id: req.params.id,
                user_id: req.user.id 
            }
        });

        if (updated) {
            const anniversary = await Anniversary.findOne({
                where: { 
                    id: req.params.id,
                    user_id: req.user.id 
                }
            });
            res.json(anniversary);
        } else {
            res.status(404).json({ message: '纪念日不存在' });
        }
    } catch (error) {
        console.error('更新纪念日失败:', error);
        res.status(500).json({ message: '更新纪念日失败' });
    }
});

// 删除纪念日
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const deleted = await Anniversary.destroy({
            where: { 
                id: req.params.id,
                user_id: req.user.id 
            }
        });

        if (deleted) {
            res.json({ message: '删除成功' });
        } else {
            res.status(404).json({ message: '纪念日不存在' });
        }
    } catch (error) {
        console.error('删除纪念日失败:', error);
        res.status(500).json({ message: '删除纪念日失败' });
    }
});

module.exports = router; 