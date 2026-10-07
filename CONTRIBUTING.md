# 修改与提交说明

先读 [AGENTS.md](AGENTS.md)、[技术规格](docs/technical/SPEC.md)和[技术计划](docs/technical/PLAN.md)。涉及页面、交互或素材时，通过[对应表](docs/README.md)找到 P/R/U/T 编号，再查设计规范。

目录、命名、分支、提交、素材与远程设置统一遵循[仓库管理规范](docs/technical/REPOSITORY_CONVENTIONS.md)。常见流程：

1. 从最新 main 建立短期分支，一次解决一个清楚的问题。
2. 优先复用框架或插件；调整需求时先更新对应规格，完成后在 PLAN 记录实际证据。
3. 执行下面的仓库检查。网站工程建立后，按改动追加类型检查、生产构建或实际交互验证。
4. 使用 PR 模板写明改动、关联编号、验证和限制；必需检查通过后 Squash 合并。

```powershell
npm ci --prefix tools/ci --ignore-scripts --no-audit --no-fund
npm --prefix tools/ci run check
npm --prefix tools/ci test
```

当前尚无 Astro 网站工程，构建与发布会明确跳过。不要提交本地原始学习资料、凭证、生成目录或私密草稿。素材采用前查明来源与许可。
