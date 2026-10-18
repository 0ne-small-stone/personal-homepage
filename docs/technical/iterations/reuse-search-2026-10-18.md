# 搜索改为上游组件及最小安装补丁

2026-10-18，用户继续已批准的复用优化队列。独立分支 `codex/reuse-search-2026-10-18`，基线 main d8affcc1；不覆盖共享 WIP，不整合前四片 Draft PR。

## 实际原因与选择

- 当前 Search.astro 整份复制 Starlight 0.42.5 模板、样式与脚本，真实差异主要是 Astro ClientRouter 的初始化和销毁；本地 lssh-site-search 标签还与 article-navigation 的 site-search 查询和既有 CSS 不一致。
- 上游安装源码仅依赖一次 DOMContentLoaded 初始化 Pagefind，并留下全局匿名键盘监听，直接删副本会使客户端进入/返回不可靠。
- 复用成熟的 patch-package 8.0.1（MIT，开发依赖），把必要差异作为版本化安装补丁。重新使用原生 Search 的模板、图标、翻译、Pagefind 配置和 CSS，不迁移包管理器或增加前端搜索依赖。
- npm postinstall 严格应用补丁；CI 原有完整安装会执行该步骤。只读 CMS 候选生成的 ignore-scripts 安装不使用搜索，不为它额外安装或执行补丁。依赖升级不匹配须阻塞，禁止静默恢复无补丁上游行为。

## 范围和验证门槛

原生 connected/disconnected 回调管理每个实际搜索实例；初始化同时覆盖直接加载和 astro:page-load，异步 Pagefind 导入期间离页不回写；取消空闲任务并清理监听、UI 及捕获的旧 body 状态。保持搜索功能、原路径、过滤元数据与返回语境；不改视觉参数或全文索引范围。

实际切页发现 @pagefind/default-ui 1.5.2 的 UI 销毁会调用共享引擎 destroy，打断尚在完成的查询并记录 worker terminated。增加同版本小补丁：UI 只销毁自己的状态，取消 debounce、停止已销毁实例的初始化等待及结果回写；文档内共享引擎供后续 UI 继续复用，整份文档退出时由浏览器释放。同步官方 Svelte 源码与 npm 的 ESM/CJS 两入口，不改引擎、搜索算法、索引或 worker 协议。没有新增轮询或重建另一套 UI。

用生命周期测试验证实际打过补丁的组件脚本，包括延迟初始化、导入中移除、重连、快捷键和跨 body 清理。生产构建后的真实 Pagefind 检查中文搜索、类型/主题筛选、打开结果与返回、重复客户端切页及 390 窄屏。测试替身不代替索引与浏览器验证。

CMS reference 及历史源码作为第五片的剩余审查另记录结论；未验证等价前不替换或批量删除。

## 官方来源

- [Starlight 搜索](https://starlight.astro.build/guides/site-search/)与[组件覆盖](https://starlight.astro.build/guides/overriding-components/)，实际依据是锁定 0.42.5 安装源码。
- [patch-package](https://github.com/ds300/patch-package)：在 npm 安装后应用并版本管理依赖补丁，开发依赖，不进入浏览器产物。
- [Astro ClientRouter 生命周期](https://docs.astro.build/en/guides/view-transitions/#lifecycle-events)：承接现有 astro:page-load 与离页行为。

## 状态

工程和限定浏览器验证完成，待 Draft PR 审查；未合并发布，不标独立或用户通过。

- npm postinstall 严格应用 Starlight 0.42.5 与 @pagefind/default-ui 1.5.2 两份补丁成功；补丁创建/应用用现成 patch-package，不加入自制补丁执行器。
- `npm run test:search`：9 项通过。6 项运行实际安装的 Starlight 脚本，3 项运行实际安装的 Pagefind UI ESM；仅引擎/模块依赖和原生模态采用替身，不复制被测业务实现。
- `npm run check`：167 文件、0 错误/警告、4 条既有提示；54 页生产构建及 Pagefind 55 HTML 索引通过，最终构建 9.94 秒。原有博客 override、404 路由冲突和大块提示保留。
- 实际 IAB 1280×720/390×844：中文查询、文章/主题组合、笔记查询及空结果恢复、阅读后关键词/筛选/焦点、Escape/Control+K/取消关闭。最终 worker 修复包两次完整阅读返回恢复，单一输入实例，控制台 error 读回为空；旧两次 worker 错误保留修前证据。
- [原图、读回和版本证据](evidence/reuse-search-2026-10-18/README.md)。CMS/历史源码结论与两份旧音乐实现清理在独立收尾片，不跨分支代验。
