# SlackChat

一个轻量级的实时团队聊天应用，类似 Slack / Discord。支持多频道、实时消息推送、用户认证和访客模式。

## 技术栈

**后端 (Rust)**
- [Axum 0.8](https://github.com/tokio-rs/axum) — Web 框架，内置 WebSocket 支持
- [SQLx 0.8](https://github.com/launchbadge/sqlx) — PostgreSQL 驱动，编译期 SQL 校验 + 自动迁移
- [jsonwebtoken](https://github.com/Keats/jsonwebtoken) — JWT 认证（HMAC 签名）
- [bcrypt](https://github.com/Keats/rust-bcrypt) — 密码哈希
- [tokio](https://tokio.rs/) — 异步运行时，broadcast channel 实现消息广播
- [DashMap](https://github.com/xacrimon/dashmap) — 并发安全的 channel 广播注册表

**前端 (JavaScript)**
- [Vue 3](https://vuejs.org/) — Composition API + `<script setup>`
- [Vite 8](https://vitejs.dev/) — 构建工具
- [Tailwind CSS v4](https://tailwindcss.com/) — 原子化 CSS
- [daisyUI v5](https://daisyui.com/) — 组件库，内置 14 款主题

## 功能特性

- **实时消息** — 基于 WebSocket + tokio broadcast channel，消息即时送达
- **多频道** — 创建和切换文字频道，注册用户可创建新频道
- **消息历史** — 每次连接自动回放最近 50 条消息
- **JWT 认证** — 注册 / 登录，token 有效期 7 天
- **访客模式** — 一键匿名体验，仅限 `general` 频道，token 有效期 1 天
- **14 款主题** — dark、light、cyberpunk、cupcake、synthwave、nord、sunset、winter、coffee、lemonade、luxury、business、autumn、dim
- **会话持久化** — token 和当前频道保存在 sessionStorage，主题保存在 localStorage，刷新页面自动恢复
- **智能滚动** — 新消息自动滚到底部，向上滚动查看历史时不打断
- **移动端适配** — 响应式布局，侧边栏抽屉式展开

## 项目结构

```
SlackChat/
├── backend/                  # Rust 后端
│   ├── Cargo.toml
│   ├── .env                  # DATABASE_URL, JWT_SECRET
│   ├── migrations/           # SQLx 数据库迁移脚本
│   └── src/
│       ├── main.rs           # 入口：路由、CORS、绑定 :3000
│       ├── auth.rs           # JWT Claims、AuthUser 提取器
│       ├── state.rs          # AppState：PgPool + DashMap<broadcast::Sender>
│       ├── handlers/         # 路由处理函数
│       └── models/           # 数据模型
│
├── frontend/                 # Vue 3 前端
│   ├── package.json
│   ├── vite.config.js        # 开发服务器 :5173，代理 /api 和 /ws 到 :3000
│   └── src/
│       ├── main.js           # createApp 入口
│       ├── App.vue           # 根组件：登录 / 聊天布局切换
│       ├── style.css         # Tailwind + daisyUI + 自定义样式
│       ├── composables/      # 组合式函数（状态、WebSocket、频道）
│       └── components/       # Vue 组件
```

## 数据库迁移

项目使用 [SQLx](https://github.com/launchbadge/sqlx) 管理数据库迁移，迁移脚本位于 `backend/migrations/`，应用启动时自动执行。

### 安装 SQLx CLI

```bash
cargo install sqlx-cli --version 0.8.6
```

> 版本需与 `Cargo.toml` 中 sqlx 的版本一致。

### 常用命令

```bash
# 创建新的迁移脚本
sqlx migrate add <名称>          # 例如：sqlx migrate add add_is_guest_to_users

# 执行所有未执行的迁移
sqlx migrate run                 # 等同于 sqlx migrate run --source backend/migrations

# 回滚最近一次迁移
sqlx migrate revert

# 查看迁移状态
sqlx migrate info

# 使用指定数据库 URL 执行迁移
DATABASE_URL="postgres://用户名:密码@localhost/slackchat" sqlx migrate run
```

## API 端点

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/ws/{channel}` | WebSocket 实时消息 | 否 |
| GET | `/api/channels` | 获取频道列表（访客仅见 general） | JWT |
| POST | `/api/channels` | 创建频道（访客禁止） | JWT |
| POST | `/api/register` | 注册账号 | 否 |
| POST | `/api/login` | 登录，返回 JWT（7 天有效） | 否 |
| POST | `/api/guest_login` | 创建临时访客账户，返回 JWT（1 天有效） | 否 |
| GET | `/api/me` | 获取当前用户信息 | JWT |

### WebSocket 协议

连接 `/ws/{channel}` 后：
1. 服务端立即回放该频道最近 50 条历史消息
2. 客户端发送 JSON：`{"channel": "name", "username": "user", "content": "text"}`
3. 服务端存入 PostgreSQL 后广播给频道内所有在线客户端

## 快速开始

### 前置条件

- [Rust](https://www.rust-lang.org/) (stable)
- [Node.js](https://nodejs.org/) 和 npm
- [PostgreSQL](https://www.postgresql.org/) 运行中的实例

### 1. 启动后端

```bash
cd backend

# 创建 .env 文件，配置数据库连接和 JWT 密钥
cat > .env << EOF
DATABASE_URL=postgres://用户名:密码@localhost/slackchat
JWT_SECRET=你的密钥
EOF

# 首次运行前手动创建数据库（迁移会自动执行）
# createdb slackchat

cargo run
```

后端启动在 `http://0.0.0.0:3000`，首次启动时 SQLx 迁移会自动建表。

### 2. 启动前端

```bash
cd frontend

npm install
npm run dev
```

前端开发服务器启动在 `http://localhost:5173`，Vite 自动将 `/api` 和 `/ws` 请求代理到后端。

### 3. 生产构建

```bash
cd frontend
npm run build
```

构建产物输出到 `frontend/dist/`，可直接部署到静态文件服务器。

## 环境变量

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `DATABASE_URL` | 是 | — | PostgreSQL 连接字符串 |
| `JWT_SECRET` | 否 | 开发用硬编码值 | JWT 签名密钥 |
| `PORT` | 否 | 3000 | 后端监听端口 |

## License

MIT
