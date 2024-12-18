# 瑞瑞和华华的纪念日网站

一个用于记录和管理生日、纪念日和倒数日的网站。

## 功能特点

- 用户注册和登录
- 生日提醒管理
- 纪念日记录
- 倒数日计时
- 数据加密存储
- 邮件提醒服务

## 技术栈

### 前端
- HTML5
- CSS3
- JavaScript (原生)
- CryptoJS (数据加密)

### 后端
- Node.js
- Express
- Sequelize (MySQL ORM)
- Nodemailer (邮件服务)

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