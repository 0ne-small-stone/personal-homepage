# 六片集中候选：执行者证据

固定 main d8affcc1 与六份输入见[实施记录](../../reuse-integration-2026-10-18.md)。此候选未合并发布，不包含共享根目录 4347 等未发布设计源。

- [桌面真实搜索筛选](search-desktop.png)、[390 搜索返回](search-390.png)：真实 Pagefind 索引和正文，没有模拟知识内容。
- [桌面静态推歌窗口](music-offline-desktop.png)、[390 静态推歌窗口](music-offline-390.png)：真实公开快照，无音乐后台，无提交。
- [390 模拟在线嵌套模态](music-nested-390.png)：同一生产 dist，API 为仅回环模拟读取，不代表实际账号/播放/下载通过。
- [逐次 DOM](browser-results.json)、[四标签 error 读回](browser-errors.json)：最终均无 error。早期桌面读回错误使用 input[type=search]，原生 Pagefind 实际为 type=text；后续记录真实输入值“验证”。首次跨标签视口设置仍为 1280，保留 offline-viewport-not-applied；最终新标签实际 390/页面 390 单独记录，不以错误标签名代验窄屏。
- [源及已安装补丁哈希](source-hashes.json)、[最终静态产物哈希](build-hashes.json)：用于对齐本次实际构建，不复制构建目录或私有原件。
- [41 项 HTTP 内容哈希](http-hashes.json)：全部构建 JS/CSS 与知识/音乐 HTML 实际读回匹配。[模拟调用](mock-calls.json)只有三次 browse/jobs 读取，未提交任何写操作。

所有测试命令、完整输出与模拟脚本在隔离工作树的 `.local-tools/`，未进入 Git。Hook 新测试首次遇中文 URL 路径和 CJS/ESM 重复上下文两个夹具问题，修正 fileURLToPath/ESM 后通过；有限测试单独关闭 GC 等待，生产回收参数保持。以上是执行者组合检查，不是独立复核或用户验收。
