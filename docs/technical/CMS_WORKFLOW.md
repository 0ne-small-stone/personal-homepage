# 网页编辑与草稿验证

T13.01 / P17、P06 / R13。当前只准备一篇固定的测试草稿，官方托管后台的真实账号保存仍待验证。使用 [Pages CMS](https://app.pagescms.org/)，不安装自托管服务。

## 进入这次验证

1. 在 Pages CMS 使用 GitHub 登录。按官方引导安装或授权 Pages CMS GitHub App，仓库选择 `0ne-small-stone/personal-homepage`。如果已经接入，可直接打开仓库。
2. 选择工作分支 `codex/t13-01-web-drafts`，打开“文章草稿验证”。[直接编辑入口](https://app.pagescms.org/0ne-small-stone/personal-homepage/codex%2Ft13-01-web-drafts/file/article-draft)使用官方原生文件路由；未登录会先进入登录页面。
   安装后若落到 `main/configuration`，改用上面的工作分支入口。本轮 `.pages.yml` 已在工作分支配置完成，main 尚未合并该配置；主分支配置页的创建按钮会触发 PR/检查保护。
3. 核对标题、摘要、文章日期、主题、标签与正文。草稿状态应开启且只读。标题改为“网页编辑草稿验证（网页已保存）”，正文末尾加入“T13.01 网页保存验证：文字、章节和代码仍在。”，保存。
4. 刷新编辑页，确认修改仍在。切换正文的 Editor / Source，检查章节、链接和代码；尝试清空标题观察原生必填提示，再取消这次未保存的修改。离开提示、错误恢复、历史入口均需真实界面逐项验证，配置通过不能代替这些结果。

首次登录和仓库授权需由账号持有人完成。本次浏览器控制工具启动失败，执行者仅在独立、未登录的 Edge 会话确认官方入口 HTTP 200 和 GitHub 登录按钮，没有操作用户已有会话或完成网页保存。

## 保存报 Resource not accessible by integration

2026-10-08 用户实际保存时报告该错误，关联 GitHub `create-or-update-file-contents` 接口。[GitHub 官方排错](https://docs.github.com/en/rest/using-the-rest-api/troubleshooting-the-rest-api#resource-not-accessible)将它归为令牌权限不足；该接口需要 [Contents 写权限](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents)。公开仓库可以读取不代表集成可以写入。

实际只读核对：工作分支 `codex/t13-01-web-drafts` 为 `protected: false`，有效分支规则为空，仓库未归档；草稿没有新增保存提交。因此本次先核对 Pages CMS 安装授权，不改应用 schema、CI 默认权限或 main 保护。

1. 保留当前尚未保存的标题和正文，在另一个页面打开 [GitHub 已安装应用](https://github.com/settings/installations)。账号为 `0ne-small-stone`，找到 **Pages CMS → Configure**。如果页面显示 No installed GitHub Apps，打开[官方 Pages CMS 安装入口](https://github.com/apps/pages-cms/installations/new)，选择仓库所属账号 `0ne-small-stone`，选择 Only select repositories 并勾选 `personal-homepage`，完成安装。
2. 核对 **Repository access** 包含 `personal-homepage`；使用 **Only select repositories** 时添加目标仓库并 Save。核对 **Permissions** 中 Contents 为 **Read and write**；有权限更新请求时，需账号持有人审核批准本次所需写权限。
3. 返回原草稿页面，在相同工作分支再次保存。若授权已正确但仍报同错，先保留未保存内容，再退出 Pages CMS 并使用同一 GitHub 账号重新登录后重试。重新登录属于刷新认证的尝试，不能预先记为修复成功。

当前浏览器控制进程仍无法启动，本地 Git 凭证调用安装列表接口也返回 403（该接口要求 GitHub App 用户令牌），无法用它读取或修改 Pages CMS 的真实安装授权。这与用户遇到的文件写入 403 是两次不同请求。具体安装范围和权限仍需设置页读回；只有实际网页保存及 GitHub 新提交确认后，才记为修复。

## 创建配置报 Changes must be made through a pull request

2026-10-08 用户在 `/main/configuration` 报该错误，GitHub 同时提示 3 项必需检查。远程读回 main 的 `.pages.yml` 为 404、分支受保护；工作分支 `.pages.yml` 为 200、分支未保护。当前配置与测试草稿已准备在 `codex/t13-01-web-drafts`，进入[文章草稿验证](https://app.pagescms.org/0ne-small-stone/personal-homepage/codex%2Ft13-01-web-drafts/file/article-draft)编辑现有文件即可。

main 的配置接入以后通过正常 PR 与三项检查完成。当前保持原保护规则，本轮先验证工作分支的草稿保存。此报错是主分支规则拒绝写入，不能单凭它宣称 Pages CMS 安装权限和真实保存已验收。

## 保存后如何核对

保存会在所选分支创建 Git 提交。它与 PR、CI、合并、网站部署是不同步骤；配置没有部署按钮。主分支继续受保护，后台需使用上述工作分支，不能因为保存被拒绝而关闭分支规则。

实际写入文件为 `src/content/docs/knowledge/blog/editor-draft-check.md`。复核新增提交、改动路径、标题/正文、`draft: true`、`entryId: demo-article-editor-draft` 和 `kind: article`；未建模的 `sidebar`、`related` 应保留。`readonly` 是后台表单行为，不能代替 GitHub 仓库权限。

保存日期可能是带引号的 `yyyy-MM-dd`；工程将有效日历日期转换为博客原生 Date。非法日期应在内容校验失败，不进入生产构建。

真实保存后拉取分支，运行 `npm run check`、`npm run build`，再核对：学习总览仍为 40 条已发布内容、文章列表仍只有一篇功能验证样稿；新草稿地址返回 404，公开 HTML 和 Pagefind 不包含该草稿。原生搜索可能按词元命中其他文章，验收依据是结果的实际地址与内容，而非泛词查询必须为零。

本地网站验收入口：[学习总览](http://127.0.0.1:4322/personal-homepage/knowledge/)、[文章列表](http://127.0.0.1:4322/personal-homepage/knowledge/blog/)。保存草稿本身不会把正文显示在这些入口。

本轮先验证文字编辑与草稿。图片上传归 T13.02，开启发布及实际网站部署归 T13.03 / T15 / T16。
