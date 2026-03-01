# 雷檬云 LeiMengYun

糖尿病健康管理平台 — 面向患者与医生的 H5 应用。

## 本地部署

### 前置条件

- Node.js >= 20
- pnpm >= 9（可通过 `corepack enable pnpm` 启用）
- Docker Desktop（用于 PostgreSQL 与 Redis）

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动数据库

```bash
docker compose up -d
```

### 3. 环境与数据库

后端已配置 `apps/server/.env`（由 `.env.example` 复制），数据库连接为：

- PostgreSQL: `localhost:5432`（用户 leimengyun / 密码 leimengyun123）
- Redis: `localhost:6379`

执行迁移并生成 Prisma 客户端：

```bash
cd apps/server
pnpm prisma migrate dev
pnpm prisma generate
```

### 4. 启动服务

```bash
# 根目录
pnpm dev
```

或分别启动：

| 服务 | 命令 | 端口 |
|------|------|------|
| 后端 API | `pnpm dev:server` | 3000 |
| 患者端 H5 | `pnpm dev:patient` | 5173 |
| 医生端 H5 | `pnpm dev:doctor` | 5174 |

### 5. 访问地址

- 患者端: http://localhost:5173
- 医生端: http://localhost:5174
- API 文档: http://localhost:3000/api/docs

### 开发登录说明

登录 API 接受任意 6 位验证码（如 `123456`），可自动创建用户。
