const express = require('express');
const cors = require('cors');
const supabase = require('./config/database');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const authMiddleware = require('./middleware/auth');
const path = require('path');

const app = express();

// 中间件配置
app.use(cors({
    origin: '*',  // 允许所有域名访问
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 基础路由放在最前面
app.get('/', (req, res) => {
    res.json({ 
        message: 'API is running',
        time: new Date().toISOString()
    });
});

app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'online',
        time: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development'
    });
});

// 生日相关路由
app.get('/api/birthdays', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('birthdays')
            .select(`
                id,
                name,
                birth_date,
                lunar,
                description,
                reminder_days,
                created_at,
                updated_at
            `)
            .order('birth_date');

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('获取生日数据错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// 添加生日
app.post('/api/birthdays', authMiddleware, async (req, res) => {
    try {
        const { name, birth_date, lunar, description, reminder_days } = req.body;
        const { data, error } = await supabase
            .from('birthdays')
            .insert([{
                name,
                birth_date,
                lunar: lunar || false,
                description,
                reminder_days: reminder_days || 0
            }])
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('添加生日数据错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// 倒计时（life_day）相关路由
app.get('/api/life-days', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('life_day')
            .select(`
                id,
                title,
                target_date,
                description,
                created_at,
                updated_at
            `)
            .order('target_date');

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('获取倒计时数据错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// 添加倒计时
app.post('/api/life-days', authMiddleware, async (req, res) => {
    try {
        const { title, target_date, description } = req.body;
        const { data, error } = await supabase
            .from('life_day')
            .insert([{
                title,
                target_date,
                description
            }])
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('添加倒计时数据错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// 纪念日相关路由
app.get('/api/anniversaries', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('anniversaries')
            .select(`
                id,
                title,
                date,
                type,
                description,
                reminder_days,
                important,
                created_at,
                updated_at
            `)
            .order('date');

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('获取纪念日数据错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// 获取纪念日类型
app.get('/api/anniversary-types', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('anniversary_types')
            .select('*')
            .order('name');

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('获取纪念日类型错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// 用户注册
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, username } = req.body;
        
        // 检查用户是否已存在
        const { data: existingUser } = await supabase
            .from('Users')
            .select('email')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: '该邮箱已被注册' });
        }

        // 创建新用户
        const { data, error } = await supabase
            .from('Users')
            .insert([{ email, password, username }])
            .select()
            .single();

        if (error) throw error;

        // 生成 JWT token
        const token = jwt.sign(
            { userId: data.id, email: data.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token, user: data });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data: user, error } = await supabase
            .from('Users')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: '邮箱或密码错误' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token, user });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// 发送验证码
app.post('/api/auth/send-code', async (req, res) => {
    try {
        const { email, type } = req.body;
        const code = Math.random().toString().slice(2, 8);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

        // 保存验证码
        const { error } = await supabase
            .from('VerificationCodes')
            .insert([{
                email,
                code,
                type,
                expiresAt
            }]);

        if (error) throw error;

        // 发送邮件
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: '验证码',
            text: `您的验证码是：${code}，10分钟内有效。`
        });

        res.json({ message: '验证码已发送' });
    } catch (error) {
        console.error('发送验证码错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// 验证邮箱
app.post('/api/auth/verify-email', async (req, res) => {
    try {
        const { email, code } = req.body;

        const { data: verificationCode, error } = await supabase
            .from('VerificationCodes')
            .select('*')
            .eq('email', email)
            .eq('code', code)
            .eq('used', false)
            .gt('expiresAt', new Date().toISOString())
            .single();

        if (error || !verificationCode) {
            return res.status(400).json({ error: '验证码无效或已过期' });
        }

        // 标记验证码为已使用
        await supabase
            .from('VerificationCodes')
            .update({ used: true })
            .eq('id', verificationCode.id);

        res.json({ message: '邮箱验证成功' });
    } catch (error) {
        console.error('验证邮箱错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ 
        message: '服务器错误',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 如果是开发环境才启动服务器
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

// API 路由
app.get('/api/test', (req, res) => {
    try {
        res.json({ 
            message: 'API is working',
            time: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;