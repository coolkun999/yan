# 言 (Yan) - 社交平台

一个简洁的中文社交平台，类似 Twitter/微博。

## 功能

- ✅ 用户注册/登录（邮箱+密码）
- ✅ 发帖/删帖
- ✅ 点赞/取消点赞
- ✅ 回复帖子
- ✅ 关注/取消关注用户
- ✅ 用户主页
- ✅ 搜索用户
- ✅ 响应式设计（支持移动端）

## 技术栈

### 前端
- 纯 HTML/CSS/JavaScript（无框架）
- Leaflet 地图（OpenStreetMap）
- 响应式设计

### 后端
- Node.js + Express
- SQLite（sql.js，纯 JS 实现）
- JWT 认证
- bcrypt 密码加密

### 部署
- Nginx 反向代理
- PM2 进程管理
- 阿里云服务器

## 快速开始

### 本地开发

```bash
# 安装后端依赖
cd server
npm install

# 启动后端
node index.js

# 前端直接用浏览器打开 index.html
# 或者用 Live Server 等工具
```

### 部署到服务器

```bash
# 一键部署
python deploy.py
```

## 项目结构

```
yan/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式
├── js/
│   ├── api.js          # API 客户端
│   ├── auth.js         # 认证系统
│   └── app.js          # 主应用逻辑
├── data/
│   └── db.js           # 静态数据（前端用）
├── server/
│   ├── index.js        # Express 服务器
│   ├── db.js           # SQLite 数据库
│   ├── routes/
│   │   ├── auth.js     # 认证路由
│   │   ├── posts.js    # 帖子路由
│   │   └── users.js    # 用户路由
│   └── package.json
├── deploy.py           # 部署脚本
└── README.md
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| GET | /api/auth/me | 获取当前用户 |
| GET | /api/posts | 帖子列表 |
| POST | /api/posts | 发帖 |
| DELETE | /api/posts/:id | 删帖 |
| POST | /api/posts/:id/like | 点赞 |
| POST | /api/posts/:id/reply | 回复 |
| GET | /api/users/:handle | 用户主页 |
| POST | /api/users/:handle/follow | 关注 |
| GET | /api/users/search/:keyword | 搜索 |

## 测试账号

| 邮箱 | 密码 |
|------|------|
| wangkun2099@gmail.com | 123456 |
| lin@example.com | 123456 |
| tech@example.com | 123456 |

## 访问地址

- 前端: https://www.kunshagj.com/yan/
- API: https://www.kunshagj.com/yan/api/health

## 更新日志

### v1.0.0 (2026-06-03)
- 初始版本
- 用户系统
- 帖子 CRUD
- 点赞/回复
- 关注系统
