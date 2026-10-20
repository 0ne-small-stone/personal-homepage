# Echoes 音乐 API

网页仍由 GitHub Pages 提供，Cloudflare Workers Free 只处理网易云 API。D1 保存按设备隔离的加密登录与扫码状态；`MUSIC_SESSION_KEY` 是 32 随机字节的标准 Base64，只配置为 Worker Secret。禁止使用全局网易云 Cookie、本机 DPAPI、LX 脚本或私有音频。实际状态与验收见[实施记录](../../docs/technical/iterations/t25-p13-2026-10-20-pages-free-backend.md)。

## 验证与部署

```sh
npm ci
npm run music:edge-test
npm run music:edge-build
npx wrangler d1 create echoes-music-sessions
# 将返回的公开 database_id 写入 wrangler.jsonc，保持 Workers Free。
npx wrangler d1 migrations apply echoes-music-sessions --remote --config services/music-edge/wrangler.jsonc
npx wrangler secret put MUSIC_SESSION_KEY --config services/music-edge/wrangler.jsonc
npx wrangler deploy --config services/music-edge/wrangler.jsonc
```

首次部署需官方 OAuth 授权；凭据使用系统凭据库。不得把 OAuth、登录 Cookie 或 Secret 填进源码/构建变量。`PUBLIC_MUSIC_API_ORIGIN` 仅为公开 API HTTPS Origin，由 Pages 构建读取；没有配置时保留既有本机同源接口。CORS 固定 Pages Origin，不接任意代理，不复制网页到后端。请求采用 P-256 设备签名，不依赖第三方 Cookie。

D1 按迁移建表，运行时不执行 DDL。定时任务每六小时分批清理过期项。退出即撤销该设备会话；清理浏览器站点数据或 30 天会话到期需重新扫码。授权范围以网易云实际返回为准，`unblock` 永不启用。歌单收藏需要额外平台校验，云端明确提示使用网易云；文件上传/下载与 LX 继续由本机服务处理。
