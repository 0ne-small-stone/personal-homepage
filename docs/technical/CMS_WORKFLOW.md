# 网页编辑与草稿验证

T13.01 / P17、P06 / R13。当前只准备一篇固定的测试草稿，官方托管后台的真实账号保存仍待验证。使用 [Pages CMS](https://app.pagescms.org/)，不安装自托管服务。

## 进入这次验证

1. 在 Pages CMS 使用 GitHub 登录。按官方引导安装或授权 Pages CMS GitHub App，仓库选择 `0ne-small-stone/personal-homepage`。如果已经接入，可直接打开仓库。
2. 选择工作分支 `codex/t13-01-web-drafts`，打开“文章草稿验证”。[直接编辑入口](https://app.pagescms.org/0ne-small-stone/personal-homepage/codex%2Ft13-01-web-drafts/file/article-draft)使用官方原生文件路由；未登录会先进入登录页面。
3. 核对标题、摘要、文章日期、主题、标签与正文。草稿状态应开启且只读。标题改为“网页编辑草稿验证（网页已保存）”，正文末尾加入“T13.01 网页保存验证：文字、章节和代码仍在。”，保存。
4. 刷新编辑页，确认修改仍在。切换正文的 Editor / Source，检查章节、链接和代码；尝试清空标题观察原生必填提示，再取消这次未保存的修改。离开提示、错误恢复、历史入口均需真实界面逐项验证，配置通过不能代替这些结果。

首次登录和仓库授权需由账号持有人完成。本次浏览器控制工具启动失败，执行者仅在独立、未登录的 Edge 会话确认官方入口 HTTP 200 和 GitHub 登录按钮，没有操作用户已有会话或完成网页保存。

## 保存后如何核对

保存会在所选分支创建 Git 提交。它与 PR、CI、合并、网站部署是不同步骤；配置没有部署按钮。主分支继续受保护，后台需使用上述工作分支，不能因为保存被拒绝而关闭分支规则。

实际写入文件为 `src/content/docs/knowledge/blog/editor-draft-check.md`。复核新增提交、改动路径、标题/正文、`draft: true`、`entryId: demo-article-editor-draft` 和 `kind: article`；未建模的 `sidebar`、`related` 应保留。`readonly` 是后台表单行为，不能代替 GitHub 仓库权限。

保存日期可能是带引号的 `yyyy-MM-dd`；工程将有效日历日期转换为博客原生 Date。非法日期应在内容校验失败，不进入生产构建。

真实保存后拉取分支，运行 `npm run check`、`npm run build`，再核对：学习总览仍为 40 条已发布内容、文章列表仍只有一篇功能验证样稿；新草稿地址返回 404，公开 HTML 和 Pagefind 不包含该草稿。原生搜索可能按词元命中其他文章，验收依据是结果的实际地址与内容，而非泛词查询必须为零。

本地网站验收入口：[学习总览](http://127.0.0.1:4322/personal-homepage/knowledge/)、[文章列表](http://127.0.0.1:4322/personal-homepage/knowledge/blog/)。保存草稿本身不会把正文显示在这些入口。

本轮先验证文字编辑与草稿。图片上传归 T13.02，开启发布及实际网站部署归 T13.03 / T15 / T16。
