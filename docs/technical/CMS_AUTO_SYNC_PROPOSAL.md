# 关联候选自动回写：待用户确认

状态：未接入。自动审批拒绝了新增 `contents: write`、`actions: write`并让CI回写文件/触发工作流的补丁，理由是用户尚未明确授权该权限范围与远程写入。现有workflow保持contents:read；网页保存后的构建已用只读派生修复。

建议的具体动作：仅在本仓库 `codex/learning-*`、`codex/content-*`的push/手动验证，三项检查成功后，用短效GITHUB_TOKEN提交 `.pages.yml`唯一生成区的候选变化，并workflow_dispatch同分支的site.yml，使新head获得检查。相同候选不提交、不递归；遇到更新的head或内容SHA冲突退出，不覆盖后来的Save。main和PR检出不执行回写。

需要新增的job权限是contents:write（提交仓库文件）和actions:write（触发验证）。GitHub令牌权限不是文件/分支粒度，代码限制仅写上述分支的.pages.yml；若job代码被不当改动，令牌技术上有更广的仓库写入能力。这是需要明确确认的权限扩展。无需新增PAT、长期凭证、服务或解除main保护。

可审阅的流程：`已验证源提交 → 生成候选 → 读回分支head与.pages.yml的SHA → 有变化才提交该文件 → 触发同分支检查 → 新head三项成功`。派生脚本已存在并实测；权限job及API回写适配尚未安装，也未通过绕路执行。

用户可批准上述权限与动作，或保持当前由开发者同步候选。批准后再实施一个独立切片，核验无变化、并发Save、权限失败、新head检查与不写main五种边界。此决定不影响已有Pages发布配置。
