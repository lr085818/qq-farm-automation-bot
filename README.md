# QQ 农场多账号挂机 + Web 面板

- 基于 Node.js 的 QQ 农场自动化工具，支持多账号管理、Web 控制面板、实时日志与数据分析。
- 默认账号密码都是 `admin`，端口 `3007`，请部署登录后尽快修改密码！

---

## 技术栈

**后端**

[<img src="https://skillicons.dev/icons?i=nodejs" height="48" title="Node.js 20+" />](https://nodejs.org/)
[<img src="https://skillicons.dev/icons?i=express" height="48" title="Express 4" />](https://expressjs.com/)
[<img src="https://skillicons.dev/icons?i=socketio" height="48" title="Socket.io 4" />](https://socket.io/)

**前端**

[<img src="https://skillicons.dev/icons?i=vue" height="48" title="Vue 3" />](https://vuejs.org/)
[<img src="https://skillicons.dev/icons?i=vite" height="48" title="Vite 7" />](https://vitejs.dev/)
[<img src="https://skillicons.dev/icons?i=ts" height="48" title="TypeScript 5" />](https://www.typescriptlang.org/)
[<img src="https://cdn.simpleicons.org/pinia/FFD859" height="48" title="Pinia 3" />](https://pinia.vuejs.org/)
[<img src="https://skillicons.dev/icons?i=unocss" height="48" title="UnoCSS" />](https://unocss.dev/)

---

## 部署方式

### 方式一：Docker（推荐，适合 Linux 服务器）

**环境要求：** Docker 20+、docker compose

```bash
# 1. 安装 Docker（如未安装）
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker

# 2. 拉取仓库
git clone https://github.com/lr085818/qq-farm-automation-bot.git
cd qq-farm-automation-bot

# 3. 构建并后台启动（首次约需 5~10 分钟）
docker compose up -d --build

# 查看启动日志
docker compose logs -f

# 停止
docker compose down

# 更新代码后重新构建
git fetch origin && git reset --hard origin/main && docker compose up -d --build
```

---

### 方式二：本地运行（Windows）

**环境要求：** Node.js 20+、pnpm

```powershell
# 1. 安装 Node.js 20+（https://nodejs.org/）并启用 pnpm
corepack enable

# 2. 克隆仓库
git clone https://github.com/lr085818/qq-farm-automation-bot.git
cd qq-farm-automation-bot

# 3. 安装依赖
pnpm install

# 4. 构建前端
pnpm build:web

# 5. 启动后端
cd core
node client.js
```

启动后访问 `http://localhost:3007`

**开发模式（前后端热更新）：**

```powershell
# 终端1：启动后端
cd core
node client.js

# 终端2：启动前端开发服务器
cd web
pnpm dev
# 访问 http://localhost:5173
```

---

### 方式三：本地运行（Linux/macOS）

```bash
# 1. 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
corepack enable

# 2. 克隆仓库
git clone https://github.com/lr085818/qq-farm-automation-bot.git
cd qq-farm-automation-bot

# 3. 安装依赖并构建
pnpm install
pnpm build:web

# 4. 启动（建议配合 pm2 保活）
npm install -g pm2
pm2 start core/client.js --name qq-farm-bot
pm2 save && pm2 startup
```

---

## 访问面板

启动成功后浏览器访问：
- 本机：`http://localhost:3007`
- 远程：`http://<服务器IP>:3007`

**默认账号：** `admin` / `admin`，**请登录后立即修改密码！**

---

## 项目结构

```
qq-farm-automation-bot/
├── core/                  # 后端（Node.js 机器人引擎）
│   ├── src/
│   │   ├── config/        # 配置管理
│   │   ├── controllers/   # HTTP API
│   │   ├── gameConfig/    # 游戏静态数据
│   │   ├── models/        # 数据模型与持久化
│   │   ├── proto/         # Protobuf 协议定义
│   │   ├── runtime/       # 运行时引擎与 Worker 管理
│   │   └── services/      # 业务逻辑（农场、好友、任务等）
│   ├── data/              # 运行时数据（自动生成）
│   └── client.js          # 主进程入口
├── web/                   # 前端（Vue 3 + Vite）
│   └── src/
│       ├── components/    # Vue 组件
│       ├── stores/        # Pinia 状态管理
│       └── views/         # 页面视图
├── docker-compose.yml
└── package.json
```

---

## 常见问题

### 启动后提示「客户端版本过低，请升级到最新版本」

游戏服务端会定期升级协议版本，需手动更新 `core/src/config/config.js` 中的 `clientVersion`：

```js
clientVersion: '1.11.1.7_20260518',  // 格式：版本号_日期
```

**Docker 用户** 可在面板 **后台 → 游戏版本控制** 实时修改，无需重启。

### Windows 上 pnpm install 崩溃

pnpm 在部分 Windows 环境下处理原生模块时会崩溃，改用 npm 安装：

```powershell
npm install --prefix core
npm install --prefix web
```

### 如何降低封号风险

- 巡查间隔**最小值与最大值不要相同**，建议最小 3s、最大 10s 以上
- 偷菜延迟建议 3 秒以上
- 启用**静默时段**（如凌晨 01:00 ~ 07:00），避免 24 小时不间断运行

---

## 免责声明

本项目仅供学习与研究用途。使用本工具可能违反游戏服务条款，由此产生的一切后果由使用者自行承担。

---

## 技术栈

**后端**

[<img src="https://skillicons.dev/icons?i=nodejs" height="48" title="Node.js 20+" />](https://nodejs.org/)
[<img src="https://skillicons.dev/icons?i=express" height="48" title="Express 4" />](https://expressjs.com/)
[<img src="https://skillicons.dev/icons?i=socketio" height="48" title="Socket.io 4" />](https://socket.io/)

**前端**

[<img src="https://skillicons.dev/icons?i=vue" height="48" title="Vue 3" />](https://vuejs.org/)
[<img src="https://skillicons.dev/icons?i=vite" height="48" title="Vite 7" />](https://vitejs.dev/)
[<img src="https://skillicons.dev/icons?i=ts" height="48" title="TypeScript 5" />](https://www.typescriptlang.org/)
[<img src="https://cdn.simpleicons.org/pinia/FFD859" height="48" title="Pinia 3" />](https://pinia.vuejs.org/)
[<img src="https://skillicons.dev/icons?i=unocss" height="48" title="UnoCSS" />](https://unocss.dev/)

