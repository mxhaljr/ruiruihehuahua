# 瑞瑞和华华的纪念日网站

一个用于记录和管理生日、纪念日和倒数日的网站。

## 功能特点

- 用户注册和登录
- 生日提醒管理
- 纪念日记录
- 倒数日计时
- 数据加密存储
- 邮件提醒服务

## 在线访问

- 前端地址：[Netlify](https://ruiruihehuahua.netlify.app)
- 后端地址：[Vercel](https://ruiruihehuahua.vercel.app)

## 技术栈

### 前端
- HTML5
- CSS3
- JavaScript (原生)
- CryptoJS (数据加密)
- Netlify (部署)

### 后端
- Node.js
- Express
- Sequelize (MySQL ORM)
- Nodemailer (邮件服务)
- Vercel (部署)

## 安装和运行

1. 克隆仓库
```bash
git clone https://github.com/mxhaljr/ruiruihehuahua.git
```

2. 安装依赖
```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖（如果有）
cd frontend
npm install
```

3. 配置环境变量
- 复制`.env.example`为`.env`
- 填写必要的环境变量（数据库配置、邮件服务配置等）

4. 运行项目
```bash
# 运行后端服务
cd backend
npm start

# 前端直接打开index.html或使用Live Server
```

## 部署说明

### 前端部署 (Netlify)
1. 在Netlify上创建新项目
2. 连接GitHub仓库
3. 设置构建配置：
   - 构建命令：不需要
   - 发布目录：`frontend`
4. 设置环境变量：
   - `VITE_API_BASE_URL`: 后端API地址

### 后端部署 (Vercel)
1. 在Vercel上创建新项目
2. 连接GitHub仓库
3. 设置构建配置：
   - 构建命令：`cd backend && npm install`
   - 输出目录：`backend`
4. 设置环境变量：
   - `DATABASE_URL`: 数据库连接URL
   - `JWT_SECRET`: JWT密钥
   - `EMAIL_USER`: 邮箱账号
   - `EMAIL_PASS`: 邮箱密码
   - `CORS_ORIGIN`: 前端域名

## 项目结构

```
project/
├── backend/             # 后端代码
│   ├── config/         # 配置文件
│   ├── controllers/    # 控制器
│   ├── models/        # 数据模型
│   ├── routes/        # 路由
│   └── utils/         # 工具函数
│
└── frontend/           # 前端代码
    ├── css/           # 样式文件
    ├── js/            # JavaScript文件
    └── *.html         # HTML页面
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m '添加了一些功能'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件 