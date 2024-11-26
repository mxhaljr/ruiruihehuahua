const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const birthdayRoutes = require('./birthdays');
const healthRoutes = require('./health');

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/birthdays', birthdayRoutes);

router.use((req, res, next) => {
    console.log('请求路径:', req.path);
    console.log('请求方法:', req.method);
    console.log('请求体:', req.body);
    next();
});

module.exports = router; 