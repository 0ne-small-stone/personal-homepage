# Little Stone Still Here

个人主页：学习资料与文章、创作展示、相册、常用网站、音乐电台和个人介绍。采用Astro、React与Starlight，部署至GitHub Pages。

[正式主页](https://0ne-small-stone.github.io/personal-homepage/) · [文档对应表](docs/README.md) · [最新进度与验收](docs/technical/acceptance/progress-2026-10-16.md)

## 当前状态

更新：2026-10-16。以实际代码、PR与Pages运行作准；本机样本、工程验证、独立复核、用户体验和正式发布分别记载。

| 模块 | 正式基线与本轮范围 |
| --- | --- |
| 首页 | 三卡、F03、F05及按需绘制；本轮验证El0标题可读性与取消吸附收敛修正 |
| Becoming | 总览/文章/标签/续读/CMS；36份已授权PDF及速度/沉浸按键修复已上线，完整保留 |
| Elsewhere | 本轮接入用户11站、原创SVG、分类/搜索/URL恢复与无脚本完整链接 |
| Echoes | 原曲库/黑胶/单audio；本轮接续换批/错误反馈/间隙入口，个人后台与公网分别验收 |
| 相册 / Someone | 保留正式36张WebP相册与无照片双语介绍 |
| 尚待接入 | F06、Afterimage空间版、独立迷墙与Someone流体按各自候选及验收缺口保留；F04待排期、F07未开工 |

本轮PR、检查、浏览器和公网结果统一在[验收记录](docs/technical/acceptance/progress-2026-10-16.md)更新。音乐公网无Node后台时仍展示共享歌单；现有考拉源保留内网访问提示。

## 文档入口

- [技术规格](docs/technical/SPEC.md)、[技术计划与验收](docs/technical/PLAN.md)、[技术参考](docs/technical/REFERENCES.md)。
- [设计规格](docs/design/SPEC.md)、[设计计划与验收](docs/design/PLAN.md)、[设计参考与素材](docs/design/REFERENCES.md)；统一参数见[设计规范](docs/design/SYSTEM.md)。
- [仓库管理与命名](docs/technical/REPOSITORY_CONVENTIONS.md)、[贡献入口](CONTRIBUTING.md)、[AI约定](AGENTS.md)。
- [GitHub工作流](docs/technical/GITHUB_WORKFLOW.md)、[学习功能清单](docs/technical/BECOMING_FEATURES.md)。
- [原README历史快照](docs/technical/iterations/project-readme-history-2026-10-16.md)保留旧阶段、本机入口和迁移前说明，不作为当前状态。

## 本地预览与验收

使用Node.js 24，地址保留 /personal-homepage/ 前缀。

```powershell
npm ci --no-audit --no-fund
npm run dev
# 正式构建与预览
npm run check
npm run build
npm run test:home
npm run test:links
npm run preview
```

build会校验并获取固定Release清单中的36份授权PDF，首次需要网络和足够缓存空间；原件不进入Git。test:links读取正式dist，先build。原生Pagefind搜索在生产构建后验证。

Windows本机音乐后台用 npm run music:start；账号/DPAPI/下载源留在本机，Pages不会运行个人后台。

## 从哪里开始

1. 按AGENTS的顺序读规格、计划和对应表，查看真实工作区改动。
2. 从最新main建立codex/短期分支，一轮一个明确目标；不要把旧共享工作区整批覆盖主站。
3. 修改与验证后更新对应PLAN和证据，经受保护PR、三项必需检查和Squash发布。

源码在src，允许公开的静态资源在public，设计与技术资料在docs两类目录，校验/内容/音乐工具在tools。生成物、独立预览、凭据和原始资料按.gitignore留本机；已明确授权的学习PDF通过独立Release及哈希清单构建，不重复纳入Git。
