# QQ 农场自动化机器人 - 已修复问题记录

生成日期：2026-05-28

备份位置：`D:\新建文件夹 (2)\备份\qq farm\qq-farm-automation-bot-20260528-101548-source`

说明：本文件记录本轮已经落地的修复。原 `CODE_REVIEW.md` 审查报告已移除。

---

## 安全修复

### 1. 修复 `/api/proxy` 未鉴权和开放代理风险

涉及文件：

- `core/src/controllers/admin.js`
- `web/src/stores/wx-login.ts`

修复内容：

- `/api/proxy` 不再放在 `/api` 鉴权白名单里，必须携带登录 token。
- 后端不再信任前端传入的 `x-proxy-api-url`、`x-proxy-api-key`。
- 代理目标地址和 API key 改为从服务端配置或环境变量读取。
- `action` 参数增加格式校验。
- 代理请求增加超时配置。
- 前端代理请求改为只携带 `x-admin-token`。

### 2. 修复普通用户可读取全局微信代理 `apiKey`

涉及文件：

- `core/src/controllers/admin.js`
- `web/src/stores/wx-login.ts`

修复内容：

- `/api/user/wxlogin-config` 返回配置时会清空真实 `apiKey`。
- 新增 `apiKeyConfigured` 标记，前端据此判断是否启用代理模式。
- 普通用户不再能从接口响应中拿到代理 API key。

### 3. 默认管理服务不再监听所有网卡

涉及文件：

- `core/src/config/config.js`
- `core/src/controllers/admin.js`
- `docker-compose.yml`
- `core/Dockerfile`

修复内容：

- 管理服务默认监听 `127.0.0.1`。
- 如需对外开放，可显式设置 `ADMIN_HOST=0.0.0.0`。
- Docker 镜像和 docker-compose 已显式设置 `ADMIN_HOST=0.0.0.0`，避免容器端口映射不可访问。
- Docker 健康检查从需鉴权的 `/api/status` 改为公开的 `/api/game-version`。
- Socket.IO CORS 从 `origin: '*'` 改为使用 `ALLOWED_ORIGINS`。

### 4. 默认管理员保留固定 `admin/admin`，同时支持环境变量覆盖

涉及文件：

- `core/src/models/user-store.js`

修复内容：

- 首次创建管理员时优先使用 `ADMIN_PASSWORD`。
- 未设置 `ADMIN_PASSWORD` 时仍使用固定默认账号密码 `admin/admin`，方便本机测试和 Docker 首次部署。

### 5. 登录限流不再默认信任伪造代理头

涉及文件：

- `core/src/config/config.js`
- `core/src/controllers/admin.js`

修复内容：

- `trust proxy` 默认关闭。
- 只有设置 `TRUST_PROXY=true` 时才读取 `CF-Connecting-IP`、`X-Real-IP`、`X-Forwarded-For`。
- 默认直连场景下登录限流使用真实 socket 地址。

### 6. 敏感运行数据和构建产物移出 Git 跟踪

涉及文件：

- `.gitignore`

已从 Git 索引移除但保留本地文件：

- `.env`
- `core/data/`
- `web/dist/`
- `web/stats.html`

修复内容：

- `.gitignore` 增加 `.env`、`core/data/`、`web/dist/`、日志文件等规则。
- 已执行 `git rm --cached -r -- .env core/data web/dist web/stats.html`。
- 这些文件本地仍存在，但以后不再进入 Git。

---

## 业务逻辑修复

### 7. 修复卡密领取后可能重复发放

涉及文件：

- `core/src/models/user-store.js`

修复内容：

- 卡密领取成功后会写入 `claimedBy` 和 `claimedAt`。
- 未过期的已领取卡密不会再次进入可领取池。
- 注册/续费时校验卡密是否被其他用户领取。
- 领取记录和卡密状态都会保存。

### 8. 修复好友黑名单重新回流到已知好友列表

涉及文件：

- `core/src/services/friend.js`

修复内容：

- `syncKnownFriendGidsFromRecentVisitors()` 返回结果会过滤黑名单 GID。
- 黑名单好友不会被同步流程重新加入有效好友列表。

### 9. 修复偷菜上限默认值失效

涉及文件：

- `core/src/utils/utils.js`
- `core/src/services/friend.js`

修复内容：

- `toNum()` 增加 `fallback` 参数。
- `toNum(plant.steal_num, 2)` 现在能正确返回默认上限 `2`。

### 10. 修复进入好友农场后异常路径未离开

涉及文件：

- `core/src/services/friend.js`

修复内容：

- `getFriendLandsDetail()` 增加 `entered` 标记。
- 使用 `finally` 确保进入好友农场后异常也会尝试 `leaveFriendFarm()`。

### 11. 登录验证失败不再直接 `process.exit(0)`

涉及文件：

- `core/src/utils/network.js`
- `core/src/runtime/worker-manager.js`

修复内容：

- 登录验证失败时网络层向主进程上报 `login_failed`。
- 主进程记录账号日志并停止对应账号。
- 避免 Worker 直接 `process.exit(0)` 导致主进程无法识别失败原因。

### 12. 修复种子生长时间硬编码 plantId 公式

涉及文件：

- `core/src/services/farm.js`

修复内容：

- 种子生长时间改为通过 `getPlantBySeedId()` 查找植物配置。
- 不再使用 `1020000 + (seedId - 20000)` 这种硬编码转换。

### 13. 统一 `autoPlantEmptyLands()` 返回值

涉及文件：

- `core/src/services/farm.js`

修复内容：

- 空地为空、背包优先策略、商店种植策略都统一返回 `{ plantedLands: [] }` 或实际种植列表。

### 14. 修复偷取果实后自动售卖可能残留

涉及文件：

- `core/src/services/warehouse.js`
- `core/src/services/friend.js`

修复内容：

- `sellAllFruits()` 从单次读取背包出售，改为出售后等待并复查背包。
- 复查仍有果实时会继续出售，默认最多重试 4 轮。
- 手动偷取和自动批量偷取后的出售启用“空背包等待重试”，避免偷取成功但果实延迟同步时直接跳过出售。
- 若复查后仍有残留，会写入 `sell_remaining` 警告日志，方便继续定位不可售或服务端异常物品。

### 15. 新增好友“不偷取”功能

涉及文件：

- `core/src/models/store.js`
- `core/src/controllers/admin.js`
- `core/src/services/friend.js`
- `web/src/stores/friend.ts`
- `web/src/views/Friends.vue`

修复内容：

- 新增账号级 `noStealFriendGids` 配置，用于保存不自动偷取的好友 GID。
- 新增 `/api/friend-no-steal` 和 `/api/friend-no-steal/toggle` 接口。
- 好友列表中新增“不偷取/恢复偷取”按钮，并显示“不偷取”状态标记。
- 自动偷菜扫描会跳过“不偷取”好友，但不影响该好友的浇水、除草、除虫和捣乱。

### 16. 优化下线提醒 Telegram 推送

涉及文件：

- `core/src/services/push.js`
- `core/src/runtime/relogin-reminder.js`
- `core/src/controllers/admin.js`
- `web/src/views/Settings.vue`

修复内容：

- Telegram 渠道下“接口地址”改为“Bot API 地址”，允许填写自定义 Telegram Bot API 代理地址。
- Telegram 未填写 Bot API 地址时默认使用 `https://api.telegram.org`。
- Telegram Token 输入改为明确的 `Bot Token#Chat ID` 格式。
- 测试通知和实际下线通知都会校验 Telegram Token 格式。
- 后端 Telegram 推送改为直接调用 Bot API，并增加 15 秒超时。

---

## 稳定性和维护性修复

### 17. 请求队列上限改为可配置

涉及文件：

- `core/src/config/config.js`
- `core/src/utils/network.js`

修复内容：

- 新增 `MAX_PENDING_REQUESTS` 环境变量。
- 默认请求队列上限从硬编码 `5` 改为 `10`。

### 18. 修复 `/api/admin/users-with-password` 调用不存在函数

涉及文件：

- `core/src/controllers/admin.js`

修复内容：

- 兼容旧接口，但改为复用 `getAllUsers()`。
- 不再调用不存在的 `getAllUsersWithPassword()`。
- 不返回密码哈希。

---

## 验证情况

已通过 `node --check` 的文件：

- `core/src/controllers/admin.js`
- `core/src/config/config.js`
- `core/src/models/user-store.js`
- `core/src/runtime/worker-manager.js`
- `core/src/services/farm.js`
- `core/src/services/friend.js`
- `core/src/services/warehouse.js`
- `core/src/services/push.js`
- `core/src/runtime/relogin-reminder.js`
- `core/src/models/store.js`
- `core/src/utils/network.js`
- `core/src/utils/utils.js`

前端类型检查未完整通过，原因是项目已有问题：

- `web/src/stores/app.ts` 中 `hexToRgb` 已声明但未使用。
- 当前环境下 `pnpm exec vue-tsc` 报 `Command "vue-tsc" not found`。

---

## 后续建议

1. 轮换已经进入过 Git 历史的账号 code、代理 API key、卡密和管理员密码。
2. 如需要彻底清理 Git 历史中的敏感数据，再单独执行历史重写。
3. 修复前端已有 TypeScript 检查问题后再跑完整 `pnpm build`。
4. 对卡密领取、代理接口、登录限流补自动化测试。
