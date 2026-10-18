# 复用清单收尾：关联复验与旧音乐入口清理

2026-10-18，用户继续已批准的复用优化队列。独立 `codex/reuse-legacy-2026-10-18`，main d8affcc1 基线。搜索小补丁为独立分支，本片不合入查询/CMS/HTTP/dialog 或其他负责人的候选。

## CMS reference 复验

当前官方文档的 reference 以单个目标 collection 搜索，可配置 multiple、search、value 和 label；没有给出跨集合或仅已发布条目的过滤选项。实际关联需求包含多个深目录中的资料、文章、笔记，草稿不能成为候选，值需保持稳定 entryId。

匿名读回官方 main 的当前提交仍为 `6f4e860a35d934406580287e7042e5e111e207a1`，与此前固定审查相同。`fields/core/reference/edit-component.tsx` 按字符串 collection 查找；`lib/github-cache-file.ts` 的 getCollectionCache 按 parentPath 等值取该目录。既有托管实测只有三个根文件夹、没有深层候选的结论，没有新的等价实现证据推翻。

因此保留 Pages CMS 原生 select/multiple 与已有候选生成/CI 回写；不增加聚合数据库、第二套内容集合、自建字段或重排内容。现有生成检查读回 41 条公开候选，草稿继续排除。本次未操作托管后台保存，不把源码推断称为新的托管验收。

## 历史源码审查与清理

使用 Knip 6.41.0（ISC）生产模式，只读生成报告，不加入项目依赖，不使用自动修复。再以实际 Astro 页面、动态导入、类型引用、工具/测试和许可记录交叉检查。工具报告不能直接作为删除清单。

- 删除 `RadioPlayer.tsx`：独立旧播放器/状态实现，没有生产或工具/测试引用，现行入口为 RadioLibraryExperience 与唯一 audioSession。
- 删除 `SharedPlaylistCatalog.tsx`：旧共享快照界面，没有现行入口引用；现在由 NetEaseMusicCatalog 探测在线/快照，使用同一核心外壳。
- 旧共享组件曾是 `music-recommendations.css` 的唯一导入者，但它不可达，实际 54 页构建的所有 11 份 CSS 中都没有 `.music-recommend-dialog`。将同一份既有 CSS 直接交给当前 RecommendationForm 导入，恢复当前功能的依赖归属，不改 CSS 参数或重画页面。
- 首页光学历史、仅测试使用的算法、等待负责人的旧入口、第三方 upstream/许可证留档均不在删除范围。它们未被入口打包不等于可以丢弃追溯和测试依据，也不因留在源码中就产生浏览器运行开销。

## 验证门槛

类型检查、全站生产构建和原音乐回归；确认构建包含推歌样式、当前唯一音频链及公开快照保持。实际生产预览在无音乐后台时打开推歌窗口、关闭/重复打开、390 窄屏；不提交推荐或登录。

## 官方来源

- [Pages CMS reference](https://pagescms.org/docs/configuration/fields/reference/)与[原生 select](https://pagescms.org/docs/configuration/fields/select/)。
- [固定 reference 实现](https://github.com/hunvreus/pagescms/blob/6f4e860a35d934406580287e7042e5e111e207a1/fields/core/reference/edit-component.tsx)、[目录缓存实现](https://github.com/hunvreus/pagescms/blob/6f4e860a35d934406580287e7042e5e111e207a1/lib/github-cache-file.ts)。
- [Knip 生产模式](https://knip.dev/features/production-mode)：提供入口可达性线索，与工具/测试引用和动态使用分别核对。

## 状态

CMS 替代评估与旧音乐源清理完成工程/限定浏览器验证，待 Draft PR 审查，未合并发布。

- 131 项既有音乐测试通过；`npm run check` 167 文件，0 错误/警告、4 条既有提示；锁文件独立离线安装后全站 54 页及 55 HTML Pagefind 索引通过，构建 9.80 秒。
- CSS/生产入口复核：同基线、仅搜索差异的前构建中无推歌选择器；本片最终 11 份 CSS 中，核心音乐块包含该选择器。CSS 源 SHA256 前后相同，未改参数。
- 实际 IAB 1280/390 无音乐后台时，当前核心外壳和真实公开快照仍可浏览；推歌窗口有原生状态说明、不显示可提交表单。桌面 28px/窄屏 20px 原 CSS padding，按钮/Escape 与重复关闭恢复入口及 body，单 audio 保持 1。未真实提交、扫码、播放或写歌单。
- [源可达性报告、源码/CSS 哈希、原图及边界](evidence/reuse-remainder-2026-10-18/README.md)。执行者检查不代表独立或用户验收。
