# 2026-10-15 仓库整理与发布文件对应

本轮从最新主站e953b96建立独立验收分支，保留共享根工作区的未提交工作和原件。知识库候选固定c19bf4a（PR #57），音乐候选按源SHA清单冻结。发布只包含已完成并验证的正式增量，实验原型不进入应用路由。

| 功能 | 设计依据/记录 | 工程归属 | 验收 |
| --- | --- | --- | --- |
| Becoming总览与文章列表 | design/SYSTEM、U09六片既有记录 | knowledge组件、becoming样式、原生Starlight/blog | 列表/标签/窄屏、现有41内容与样稿边界 |
| 文章与PDF续读 | U09文章/PDF进度记录 | lib/reading-progress、pdf-reading-progress及状态测试 | 同源保存、刷新恢复、原生PDF与快捷键 |
| 核心音乐/分类播客/刷新 | [P13正式整合](../../design/iterations/u12-p13-2026-10-15-main-integration.md) | NetEaseCoreExperience/useNetEaseCore、白名单DTO服务 | [统一验收](../acceptance/latest-release-2026-10-15.md) |
| 公网音乐降级 | P13边界与用户内网决定 | NetEaseMusicCatalog + SharedPlaylistCatalog、现有catalog回退 | 无后台仍有内容/禁用登录/重试、无真实账号写入 |
| 首页与Someone | 已发布PR #59/#62 | 保留main最新代码 | 空闲绘制、返回与语言/标题回归 |

文档仍按docs/design与docs/technical的SPEC/PLAN/REFERENCES一一对应，P/R/U/T映射仅在docs/README维护。新归档证据放technical/acceptance/evidence/latest-release-2026-10-15；本地冻结副本、构建、依赖、脚本辅助仍在忽略目录，原始图片/教材/音频与登录状态不移动、不上传。保留历史证据，不因旧状态与新交付不同而批量删除。
