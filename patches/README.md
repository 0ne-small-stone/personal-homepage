# 上游搜索的安装补丁

使用 patch-package 8.0.1，在 npm postinstall 以 `--error-on-fail` 应用。两份补丁只适配本站已有 Astro ClientRouter；上游包、模板、CSS、Pagefind 检索/worker 继续原样安装，源码与原 MIT 许可由各包保留。

| 锁定包 | 补丁职责 |
| --- | --- |
| @astrojs/starlight 0.42.5 | 原生 Search 在连接/断开时初始化和释放；恢复快捷键提示，取消 idle/异步导入，清旧 body 状态 |
| @pagefind/default-ui 1.5.2 | UI 销毁不终止整份文档的共享引擎；取消 debounce、停止销毁实例的异步等待和结果回写，Svelte/ESM/CJS 同步 |

正常安装：`npm ci`。有意使用 `--ignore-scripts` 且随后要构建网站时，必须补运行 `npm run postinstall`。仅执行 CMS 候选生成不需要搜索补丁。

升级先运行完整安装及 `npm run test:search`，再验证真实生产索引、客户端进入/返回和关闭清理。补丁失败不得删掉它或忽略退出码；重新对照上游差异，官方已覆盖时撤除对应补丁并复验。`patch-package` 只用于开发安装，不进入浏览器；不升级或更换现有框架。

[实施、来源与验收](../docs/technical/iterations/reuse-search-2026-10-18.md)。
