# P13 GitHub Pages 与免绑卡网易云后端

2026-10-20 用户明确要求：网页继续用 GitHub Pages，寻找无需绑定银行卡的免费后端，接通网易云扫码登录及账号已有权限歌曲的完整播放。此前 Render 同源页面/免费 Postgres 候选仅为历史方案，未部署，PR93 保持草稿；本片取代其部署选择，不创建 Render 或付费资源。

## 本次实现

- 独立工作树从正式 main eaea038a 接续；不覆盖共享根、首页 F04/F09 或音乐 61179 冻结候选。
- 选择 Cloudflare Workers Free + D1：官方产品页明确无需信用卡开始，Workers 免费每日 10 万请求、每请求 10ms CPU；D1 免费持久存储总量 5GB，超出免费限额时请求失败，不自动升级付费。[Workers](https://www.cloudflare.com/products/workers/)、[D1](https://www.cloudflare.com/products/d1/)、[配额](https://developers.cloudflare.com/d1/platform/pricing/)。仅部署 API，不迁移网页。
- Workers 使用固定 SDK 4.41.1 的薄业务模块与 Fetch 请求适配。优先扫码、账号恢复、搜索与已有许可播放，不执行 unblock、远端 Watchman/vm、本机 LX 或私有文件服务。平台返回试听/不可用必须如实保留。
- Pages 与 API 跨站，不能照搬此前 SameSite=Lax 同源 Cookie。使用 IndexedDB 中不可导出的 P-256 设备私钥和不透明会话 ID，逐请求签名绑定方法、路径、正文摘要、Origin、时间与随机 nonce；D1 原子防重放。网易云 Cookie 仅后端 AES-GCM 加密保存，不进入网页、仓库或日志。清理浏览器数据/会话过期后可重新扫码。
- 只允许正式 Pages Origin，JSON 限长、固定 API 路由、限流、隔离账号及过期撤销；不存在任意代理。浏览器直接播放网易云返回的 HTTPS CDN 许可地址。

## 验收状态

实施中。需真实用户扫码、权限歌曲超过 30 秒及中后段播放、浏览器刷新/后端重启恢复及另一浏览器隔离验证。离线 fixture、构建成功和部署成功均不等于公网完整播放通过。首次云端扫码不迁移本机 DPAPI 登录。

2026-10-20 工程：音乐全套初次217项通过，最后QR代际修正后Edge45项通过，包含真实Miniflare/workerd HTTP、真实D1、合成上游两账号/重建恢复/退出与迟到响应。180文件零错误/警告、4既有提示，54路由/Pagefind55HTML构建通过；公开文件1503项/657123237B及音乐目录守卫通过。锁文件既有依赖版本/resolved/integrity保持，新增56项仅部署和测试工具链/已存在的二维码依赖。

2026-10-20 云端：用户完成Cloudflare官方授权，OAuth凭据加密文件的密钥由Windows Credential Manager保护；未绑卡、未升级付费。免费D1在APAC创建并应用7条schema命令；Worker启动18ms（不是每请求CPU耗时），公开地址为[音乐API](https://echoes-music-api.3400489513-1f1.workers.dev/healthz)。首次新域名TLS未生效的失败保留；随后严格HTTPS实测health200、匿名账号200、真实网易云二维码PNG200、取消200、搜索29曲200、退出200。测试二维码未交用户扫码，测试会话已撤销。密钥仅Worker Secret，未读回或进入仓库。

GitHub Pages公开构建变量PUBLIC_MUSIC_API_ORIGIN已配置为该HTTPS Origin；前端PR/Pages发布、真实扫码及完整权限播放仍待实际验收。此前Render草稿PR93未合并，不再作为部署入口。

PR95首轮CI在私钥拒绝导出的断言失败：Linux Node返回标准InvalidAccessError，本机版本返回InvalidAccessException；两者均实际拒绝导出。修正为兼容这两种错误名，继续校验nonextractable及真实签名，不降低私钥保护。同时给共享设备注册添加独立15秒网络超时，避免一次挂起阻塞之后重试；调用方取消继续不影响其他等待者。
