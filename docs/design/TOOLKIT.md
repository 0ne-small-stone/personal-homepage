# 设计技能配置与使用分工

更新：2026-10-08。用户要求充分调研后择优配置平面设计、UI、UX 技能，并筛选高质量素材来源；本日明确要求安装 Impeccable，已完成。本文件保存技能选择、安装版本、任务路由与适配规则；文件职责及 P/R/U/T 归属统一见[文档对应表](../README.md)。

## 1. 采用结果

使用小而互补的组合：**平面构图 → 网页视觉 → 交互验证 → 规范收口**。每轮选一个主技能，按实际风险补一个审查技能；不要求每轮加载全部技能。

| 技能 | 本机状态 | 本项目职责 | 使用边界 |
| --- | --- | --- | --- |
| `canvas-design` | 本轮新安装 | 静态构图、封面、标题与图像关系；现成资源不满足时的原创平面方案 | 先检查可复用资源。沿用 CONCEPT 中 Little Stone Still Here（LSSH）的概念与命名基线。静态 PNG/PDF 不能作为网页交互验收 |
| `frontend-design` | 本轮新安装 | 把已选构图落到 Astro 页面、内容层级和局部视觉反馈；检查模板感 | 沿用现有框架、内容和设计参数；保留语义 DOM。首页场景与知识阅读分别处理，不默认整页卡片、营销 CTA 或新字体 |
| `ui-ux-pro-max` | 已有，检索实测通过 | 任务路径、键盘/触摸、焦点、状态、可中断动画、Astro 适配 | 定向检索相关规则；风格与配色推荐只作候选，不能覆盖已确认概念；核对 Web、原生平台和 WCAG 级别 |
| `design-system` | 已有，正文与参考可读 | 统一 tokens、控件状态与设计到代码的交接 | 数值唯一来源仍为 SYSTEM；按现有样式组织实现，不另生成相互竞争的规范 |
| `web-design-guidelines` | 本轮新安装 | 实施后的代码审查：语义、焦点、表单、图片尺寸、URL 状态与动画 | 用本轮变更范围作为目标；读取实际规则并记录版本/日期。代码审查仍需浏览器行为证据补充 |
| `brand` | 已有，正文与素材组织参考可读 | 在选图、文案或跨页组合时核对 CONCEPT 概念与命名的一致性及来源记录 | 按需使用。沿用 CONCEPT、SYSTEM、REFERENCES，不运行默认同步脚本建立第二份品牌规范 |
| `impeccable` | 2026-10-08 按用户要求安装；技能 4.5.0，Windows 引擎探测通过 | 设计规划与评审、构图/排版、视觉精修、克制化、动效及响应式适配 | 显式 `$impeccable` 或任务需要时加载相应子命令；沿用项目概念与唯一规范源。上下文适配和实际安装证据见 3.1，不因技能默认流程重复建立品牌体系 |

新技能安装在当前用户的 Codex 技能目录，下一轮可由技能目录发现。项目中的配置与记录用于交接；其他电脑仍需按来源安装，不把本机已安装写成整个仓库自带技能。

## 2. 比较与取舍

选择依据依次是：符合本项目表达、补足实际能力、适配现有工具与 Astro、来源与许可可追踪、运行和维护负担。没有按下载量或星数判断审美质量。

| 候选 | 调研依据与长处 | 结论及理由 |
| --- | --- | --- |
| [Anthropic frontend-design](https://github.com/anthropics/skills/tree/683bc88e56f3e09ba94f7055977f3d3aa499f202/skills/frontend-design) | 审阅当前正文；要求从具体主题推导视觉、先规划再对照 brief、自我审视装饰与文案；目录只有说明和许可 | **采用**。轻量、不绑定特定框架，适合把已有概念落实到页面 |
| [Anthropic canvas-design](https://github.com/anthropics/skills/tree/683bc88e56f3e09ba94f7055977f3d3aa499f202/skills/canvas-design) | 审阅正文、文件清单和许可；侧重空间、留白、形体与字体构图，附字体资源 | **采用，限定于平面产物**。补足静态美术，但默认原创流程必须服从复用优先；随附字体不自动进入网站 |
| 本机 ui-ux-pro-max | 有 UX、运动、组件及 Astro 检索；已运行一次定向搜索 | **保留为 UX 主技能**。检查平台与规则适用性；不用通用产品模板重新定义本站 |
| 本机 design-system | 有 tokens 和状态规格参考 | **保留为规范主技能**。沿用单一规范源；脚本未因本轮调研自动运行 |
| [Vercel web-design-guidelines](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/web-design-guidelines) | 已读技能及其引用的规则；小型说明，无安装脚本；适合查找具体文件中的交互问题 | **采用为审查补充**。检索阶段与实际代码审查分工，避免两套工具同时重画页面 |
| [Impeccable](https://github.com/pbakaus/impeccable/tree/778c8a7b71ccd5bfe3ca6ac68c15d9d872d0f87d) | 原作者 Paul Bakaus 的仓库；复核 SKILL.md、Windows 启动器、文件清单与 Apache-2.0 许可；覆盖 critique、animate、polish 等 | **已按用户最新要求采用并安装**。替代 2026-10-07 的暂不安装决定。保留原有技能；以已有项目文档承接产品和视觉上下文，先按一个目标使用一个子命令 |
| 本机 ui-styling | 明确以 shadcn/Radix/Tailwind 为中心 | **条件使用**。仅当任务已需要相应组件时查阅；不为启用技能安装整套 UI 或替换 Starlight |
| 本机 design / banner-design | 综合设计入口；design 正文包含较多品牌、图标、宣传物料流程及外部生成依赖 | **不设为日常默认**。范围较宽，当前任务由上表专职技能覆盖；banner-design 未完整评估，不宣称质量低 |
| OpenAI 官方 curated 中的 Figma 系列 | 通过 skill-installer 列表确认可选条目 | **按需保留**。目前没有 Figma 文件或已连接的 Figma 工作流，不为当前配置新增依赖 |
| 内置 `imagegen` | 当前环境已提供图像生成与编辑能力 | **缺口补充**。现成素材比较后仍不满足具体要求时使用，并记录生成/改造范围；不默认启动第三方付费生图脚本 |

## 3. 安装与版本记录

2026-10-07 首轮使用系统 `skill-installer` 的官方安装脚本，以 `--method download` 下载前三项固定提交；未覆盖已有技能、未执行其附带程序。2026-10-08 同样安装 Impeccable 并运行版本探测，详见 3.1。两轮均未添加网站 npm 依赖。

| 技能 | 仓库与路径 | 固定提交 | 许可记录 |
| --- | --- | --- | --- |
| frontend-design | `anthropics/skills` → `skills/frontend-design` | `683bc88e56f3e09ba94f7055977f3d3aa499f202` | 目录内 `LICENSE.txt`：Apache-2.0 |
| canvas-design | `anthropics/skills` → `skills/canvas-design` | `683bc88e56f3e09ba94f7055977f3d3aa499f202` | 技能 `LICENSE.txt`：Apache-2.0；字体许可独立，使用具体字体前核对对应 OFL 文件 |
| web-design-guidelines | `vercel-labs/agent-skills` → `skills/web-design-guidelines` | `063bee94c3f4df8453406c830b0a7df0f2860278` | 该提交仓库 README 声明 MIT；安装目录仅有 SKILL.md，没有独立许可文件，不将该目录作为完整许可包再分发 |
| impeccable | `pbakaus/impeccable` → `.agents/skills/impeccable` | `778c8a7b71ccd5bfe3ca6ac68c15d9d872d0f87d` | Apache-2.0；已将同一提交根 LICENSE 保存到本机技能目录 |

新电脑复现：通过 `skill-installer` 调用 `scripts/install-skill-from-github.py`，依次传入上表 `--repo`、`--path`、`--ref` 和 `--method download`。默认安装至用户的 Codex 技能目录；目标已存在时先比较版本，不覆盖自定义文件。已有本机技能的上游提交未在本轮核实，保持原样，不使用未经确认的同名仓库替换。

已安装 `SKILL.md` 的 SHA-256（用于识别本机版本）：

```text
frontend-design       d91970639e9f5c37682ac7ab60094d35f1c7c1f38d731bd56396563aee10c1d3
canvas-design         a1f288079624402f30682753c1d43920b6664785698d21d3e7aa197450a6448b
web-design-guidelines f4647ca866a3accf763777f83e7682954f0187cd6bea7eea0399796652414e8f
ui-ux-pro-max         8b827fe03b349aeea99a7d6cf4ccd892e6065b672859fdb11e13a1919453eddc
design-system         655468bb723a6bc9d17fcb09a6a005e10e313d63b879f4d74fb2abdc3041ae3f
brand                 6a450ee1a83a403d47cec2ede9030feb60a67a81fc425d2406e975339313bd44
impeccable            e1a965737ca8255934bad358d5cfb8788ce013867910efd97d1daac68375e941
```

哈希记录不是自动锁定机制。升级需重新看差异与许可，更新本表，并用一个局部任务验证；不能将升级成功等同于设计效果更好。

`web-design-guidelines` 会获取[上游规则](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md)，所以技能版本固定不代表规则内容固定。实际审查时记录读取日期及可取得的提交；网络失败应标明使用了什么已有依据，不声称使用最新规则。

### 3.1 Impeccable 安装与本项目使用

来源为 [pbakaus/impeccable](https://github.com/pbakaus/impeccable)，固定提交见上表。用户级安装在 `~/.codex/skills/impeccable/`，保留上游 SKILL.md、全部 reference、agents 和 scripts，补齐上游 LICENSE；未覆盖原 frontend-design 或其他同名文件。技能下一轮可由 Codex 发现；可输入 `$impeccable`，再指定目标与动作。

常用入口：

| 子命令 | 本项目的使用时机 |
| --- | --- |
| `shape` / `critique` | 开工前组织功能与交互，或评审已有页面的层级、空间关系和任务路径 |
| `polish` / `layout` / `typeset` | 对已确定方向做对齐、间距、排版和细节精修；学习区继续使用苹方优先栈 |
| `distill` / `quieter` | 清理冗余装饰、降低过强反馈，落实圆润、克制 |
| `animate` | 细化立方体、光线、内容显露与返回的动作；保留中断、减少动画与替代操作 |
| `audit` / `adapt` | 检查可访问性、响应式与性能等具体风险；与已有检查按范围分工 |

**上下文适配：**技能所需产品事实从 `docs/technical/SPEC.md`、`docs/design/SPEC.md` 和 CONCEPT 读取；视觉规范从 SYSTEM 读取；状态、来源分别读取 PLAN 与 REFERENCES。遵守项目既有文档职责，不仅为满足默认命名新建 PRODUCT.md / DESIGN.md 或重做初始化访谈。上下文工具提示缺失时，结合这些已存在文档判断，不把文档名缺失当作项目尚未设计。新工具产物先按项目规范确定归档位置。

**模式适配：**知识库按 Read，作品与首页空间按 Experience，搜索、表单等任务界面按 Operate；以当前页面任务选择，保持真实功能与既定视觉。精修与重新设计的范围按用户当前请求判断。

**实际验证：**安装脚本成功；63 个文件（含补齐的 LICENSE）、2,226,695 字节。SKILL.md 哈希与安装前读取的固定提交源文件一致；32 个直接 reference 链接全部存在，Windows 启动器和 agents/openai.yaml 可读取。运行 `scripts/impeccable.cmd engine-probe` 返回 `impeccable-engine 0.1.11`、退出码 0；官方启动器的首次下载会核对发布文件的 SHA-256 侧车校验值。

本轮完成技能安装和引擎启动验证。项目没有新增自动执行 hook、浏览器扩展或全局子代理注册；live 浏览器模式与真实页面上的评审效果留给对应设计任务验证。常规设计工作按需调用技能，应用源码与运行依赖沿用原工程。

## 4. 项目适配规则

1. **概念和参数沿用现有文档。** 用户确定整体“圆润、克制”，具体落地读 SYSTEM 1.1；技能中的示例配色、字体、卡片和宣传文案不作本项目默认值。学习区文字按 SYSTEM 第 3 节使用苹方优先字体栈，其余区域按相应用途规则选择。
2. **先复用后创作。** 选图先读 REFERENCES；需要原创时记录现成候选及具体缺口。平面板使用真实候选或明确标注的示意内容。
3. **技能不能制造用户反馈。** 其中“客户已经不满意”等示例叙述不算本项目事实；仍区分执行者判断、用户确认和实测。
4. **审查规则须适配实际控件。** 原生按钮不重复实现浏览器已有的键盘激活；不因条目数量到某个通用阈值就直接虚拟化静态知识列表；不机械给全部字段关闭自动填充。依据用户任务、浏览器行为和实测决定。
5. **动效分类实施。** 普通 DOM 优先低成本属性；光照或 shader 动画按图形方案评估，不能把一般 CSS 建议误用为禁止场景运动。必须验证中断、取消、返回与降级。
6. **中文与内容优先。** 字号、换行、真实功能说明沿用 SYSTEM；英文名称配中文功能说明。Canvas 的少文字原则不适用于知识阅读和表单。
7. **保持既有工程。** Astro、Starlight、Pagefind 和原生成熟控件优先；技能名称不意味着必须使用 React、Tailwind、Figma 或新构建链。
8. **记录实际证据。** 每轮按 PLAN 登记素材 ID、采用规则、截图/操作、保留或回退理由；视觉质量通过样本验证，不能由技能名或来源站点担保。

## 5. 单轮调用顺序

先读现有设计 brief → 从 REFERENCES 选不超过三个候选 → 指定一个主变量和主技能 → 制作最小产物 → 按风险审查 → 在 PLAN/迭代记录保存证据。颜色、时长及视口等参数引用 SYSTEM 和 PLAN，不在这里复制数值。

用户已要求在相关工作中主动提醒可用资源：明确任务后匹配 [六个设计资源站与提醒规则](REFERENCES.md#六个设计资源站与提醒规则)，给出具体用途及链接，再继续本轮选型与验证。网站名称、用途和触发条件只在该清单维护。

| 当前小步 | 主技能 | 补充能力 | 最小证据 |
| --- | --- | --- | --- |
| 材质/图片筛选 | brand 的一致性与来源规则；需要静态排版时 canvas-design | 官方素材页及许可、实际画面观察 | 单项来源、适合/不适合的理由、同条件裁切比较 |
| 页面静态构图 | frontend-design；独立平面板用 canvas-design | design-system | 桌面与手机静态样本，真实文字及焦点安全区 |
| 单个入口或按钮 | ui-ux-pro-max | design-system；实现后 web-design-guidelines | 默认、焦点、按下、结果、关闭或返回 |
| 一段空间或光动画 | frontend-design 负责视觉落地 | ui-ux-pro-max 的可中断与替代输入规则 | 五帧、取消与反向、减少动画，实际运行记录 |
| 现成阅读/图库组件接入 | 原组件官方文档与 ui-ux-pro-max | frontend-design 仅调整外观 | 深链、键盘、手机、切页与返回位置 |
| 局部交付前检查 | web-design-guidelines | 必要时 brand 检查主题一致性 | 有位置与复现步骤的问题；修复后一次针对性复验 |

### 可直接使用的工作简报

```text
当前页面/任务/控件：[从文档对应表选择]
本轮问题与唯一变量：[例如砖材的表面细节]
概念依据：[CONCEPT 中对应规则]
固定项：[沿用 SYSTEM 的参数、既有路由、真实文案]
主技能：[一个]；本轮审查：[实际需要的一个]
复用候选：[REFERENCES 中素材 ID、来源与使用状态]
产物：[实际路径与可体验入口]
检查：[本轮必要的静态/行为/失败/返回证据]
决定：[保留/修改/回退，谁判断，尚待验证什么]
```

例如 U02/P01/P14 按用户最新附件先验证平整哑光块体，再决定是否需要弱纹理；基准见 [SYSTEM 7.2](SYSTEM.md#72-墙面的已选视觉方向)。不同时改变棱镜、光束、字体和空间运动。通过后 U03 才处理构图，U06/U07 再分别连接几何运动与受光。

## 6. 本轮验证与边界

- 三项安装脚本均返回成功；安装后重新读取 SKILL.md，记录哈希及文件清单。frontend-design 2 个文件、canvas-design 83 个文件（约 5.55 MB）、web-design-guidelines 1 个文件；三者所选目录没有可执行脚本。
- 已有 ui-ux-pro-max 的 Python 搜索运行成功，返回减少动画、焦点和焦点遮挡规则；这只证明本地检索可用。
- 已有 design-system、brand 的指导文件可读取；未运行其生成/同步脚本。三个新技能尚未用实际页面任务评估产出质量。
- 浏览器预览工具两次启动失败。本轮素材完成来源、描述、作者及可获得许可的核验，未完成现场动效体验或逐像素审美检查；U02–U14 的实际验收状态不因此前移。
- 未下载正式网站素材、未购买素材、未联系作者、未改变应用依赖和页面；后续采用记录在 REFERENCES 和对应迭代中更新。
