# 六片复用优化：发布证据

应用 main `f683a6ad40b07d0053cfe818f52c8c4cf6d6ac78`，对应集中 [PR #86](https://github.com/0ne-small-stone/personal-homepage/pull/86) 与 [Pages 39128335047](https://github.com/0ne-small-stone/personal-homepage/actions/runs/39128335047)。[发布记录](../../reuse-release-2026-10-18.md)维护正式结果，候选阶段的本机测试和模拟服务证据继续归原集中记录。

- [主线构建与部署成功原图](pages-success.png)。
- [正式站搜索返回原图](live-search-return.png)、[390 静态推歌窗口原图](live-music-static-390.png)。
- [逐次 DOM](browser-results.json)、[error 读回](browser-errors.json)：旧文档采样与最终新包操作分开，知识/音乐 error 均为空。
- [本机冻结清单对照](live-http-hashes.json)：如实保留 35/41 相同、两 HTML 差异和四本机旧文件名 404。此表不表示当前正式页面引用失效。
- [正式页面实际引用图](live-asset-graph.json)：沿首页、知识、音乐、图库、十一站及双语资料的实际 HTML、ESM 与 Vite 动态映射收集，39 项均 200；不涉及私有音乐服务或账号。
- [六份重复候选关闭结果](closed-original-prs.json)：保留分支和各片证据，没有重复合并或删除本地工作树。

本轮为执行者上线检查，不冒称完整跨浏览器、真触屏、读屏器、账号写入或审美验收。未接入共享 4347 等未发布设计候选。
