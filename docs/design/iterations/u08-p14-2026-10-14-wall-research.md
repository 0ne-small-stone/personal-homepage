# U08 / P14 可移动迷墙与留言展开研究

**后续状态：**用户同日回复“ok按照你说的来做”，已选建议并授权制作；按[第一样本](u08-p14-2026-10-14-wall-prototype.md)推进。下文未选型/未开工为研究时历史，成品验收另记。

日期：2026-10-14。关联 P14 / R08、R12 / U02、U08、U14 / T17–T19、T26–T27；首页终章连接关联 P01 / U06–U07 / T03.04。

用户要求调研优秀 UI/UX，当前想法是“类似迷墙，砖墙可以移动，点一个砖弹出来一段留言”。本轮完成参考筛选、交互拆解和适配建议；具体动作参数尚未选定，未实现留言墙、未改应用源码、未下发开发任务。首页 F03 队列继续按原任务推进。

## 研究结论

最贴近本站的是 **Palmer 的可拖动网格与原位置到详情的交接**，配合 **Grid Zoom 的局部聚焦**；内容组织参考 The Unsent Project，公共留痕的参与感参考 Before I Die。本轮未找到经验证、同时具备白砖迷墙、自由移动、单砖展开和真实留言服务的完整现成方案。上述案例各解决一部分问题。

建议首样采用正面哑光白砖墙：整面墙上下左右平移，砖的位置保持稳定；点选先停止墙面惯性，一块砖轻轻向前抽出并扩展为阅读面，关闭回到原砖和同一墙位。它是设计建议，用户当前只明确了可移动墙与点砖读留言，尚未确认这套细节。

墙材继续沿用 SYSTEM 7.2 的大块、规整错缝、平整哑光和弱接缝。主题沿用 CONCEPT 的 The Wall，不另造配色、字体或字标。Pink Floyd 官方将砖与个人经历、隔离及最终和解联系起来；本站可将“抽出一块砖，读到他人的话”转译为人与人的连接。这是本站概念推导，不是原作已有网页交互。

## 可体验案例与具体借鉴

| 来源 ID / 入口 | 已核对的机制 | 对本站的用处与边界 |
| --- | --- | --- |
| `wall-palmer-drag-detail` · [Palmer Draggable Grid](https://tympanus.net/Tutorials/PalmerDraggableGrid/) / [作者讲解](https://tympanus.net/codrops/2025/09/01/recreating-palmers-draggable-product-grid-with-gsap/) | 作者实现二维拖动、边界、惯性及滚轮移动；点选物件从网格原位置进入右侧详情区。桌面 1280×720 的初态与点击 Golden Vessel 后的稳定详情态已实际查看、截图 | 首选移动与展开关系参考。本站将陶器单元替换为错缝砖位，详情可改成中央阅读面，保留所选砖的来路。购买流程、原图和入场节奏不作为留言功能采用 |
| `wall-grid-zoom-context` · [Grid Zoom](https://tympanus.net/Development/GridZoom/) / [作者说明](https://tympanus.net/codrops/2021/12/01/grid-zoom-layout/) | 小图放大并打开内容，详情附缩略网格保留整体位置。官方明确项目 slideshow 没有实现 | 参考砖到阅读面的尺寸连续性；墙很大时再考虑小地图。本轮未实点，不据此宣称完整阅读器或缩略图导航已验证 |
| `wall-unsent-message-archive` · [The Unsent Project](https://theunsentproject.com/) / [项目说明](https://theunsentproject.com/about) | 一条话语对应独立记录，可按收件人名字检索，投稿人选择关联颜色；人工审核后进入档案 | 借短留言预览、单条身份与直接查找；本站仍用黑灰/白砖，不照搬彩色纸片、爱情主题、匿名投稿或审核制度。本轮读了官方页与记录页；未接受年龄/条款提示或提交内容 |
| `wall-before-i-die-participation` · [Before I Die / Candy Chang](https://www.candychang.com/beforeidie/) | 公共墙与简短留白句组合，参与者在共同表面留下个人表达 | 参考“一人一处痕迹”和简单邀请带来的参与感。它是实体公共艺术案例，不提供拖动网页代码；本站保持自己的文案与迷墙材质 |
| `wall-aceternity-layout` · [Aceternity Layout Grid](https://ui.aceternity.com/components/layout-grid) | 官方说明是点击网格单元后进行共享布局动画，数据具有稳定 id、内容和缩略图 | 用户收藏资源里最匹配的一项，已主动提醒。适合单砖展开候选；具体代码的键盘/弹层完整性和许可待核，不因预览便安装整套模板 |
| `wall-infinite-canvas-pan` · [Infinite Canvas](https://tympanus.net/Tutorials/InfiniteCanvas/) / [作者讲解](https://tympanus.net/codrops/2026/01/07/infinite-canvas-building-a-seamless-pan-anywhere-image-space/) | 自由平移与缩放，按区域建立附近内容，以有限素材循环出无限空间 | 适合远期辽阔感研究，P10 已登记同源控制器；不将图库三维飞行直接搬进墙。真实留言不能在不同位置循环复制，首样优先有边界的二维墙 |

建议体验顺序：先拖动 Palmer，再点一个陶器观察详情和来路；随后看 Grid Zoom 的整体/局部关系。The Unsent Project 和 Before I Die 用来比较内容与参与感。

## 建议的阅读流程

1. **到达墙面。** 首页继续承接 F02 向上垒墙；独立访问 `/guestbook/` 直接可读。固定工具位包含留下话语、最新留言、列表与返回，不要求先拖墙才能找到这些操作。
2. **探索。** 拖动移动整面墙，松手短暂减速。有留言的砖显示一小段摘录与作者；空砖保持安静，不把样例当真实发言。提示只在初次需要时出现。
3. **选中。** 悬停、触摸按下和键盘焦点均有反馈。先停止墙面运动，选中砖稍向前抽出，再连续扩大；其余墙保留在后方，适度减弱以承托文字。
4. **阅读。** 完整正文用可选择的正常网页文字，作者、日期与回复入口层级清楚；长留言在阅读面内部滚动。阅读、登录、输入和回复期间墙面静止。
5. **关闭。** 提供显眼关闭按钮与 Esc，恢复原墙位和原砖焦点；浏览器返回也能关闭阅读层。稳定留言标识可用于分享直达，具体 URL 方案归技术接入验证。
6. **留下话语。** 沿用 GitHub/Giscus，提交成功后区分“已写入讨论”与“已出现在墙上”；拿到真实留言及其稳定标识后，才可表现新砖加入。

手机保持可探索墙面与点砖阅读，同时提供普通列表。第一样本优先验证单指拖动与点击区分，缩放作为后续独立变量；不关闭浏览器页面缩放或占用系统返回手势。

## 决定体验质量的细节

| 问题 | 建议与验收点 |
| --- | --- |
| 拖墙时误开留言 | 经过拖动判定后，本次释放不触发点砖；测试微移点击、长拖和快速松手，阈值待样本确定并记 SYSTEM |
| 打开后背景仍漂移 | 打开立即收住惯性；文字选择、内部滚动、回复和登录输入不驱动背景 |
| 读完找不到原砖 | 保存墙位与缩放（若有），关闭恢复同一处；新增留言不重排旧砖，删除同步后保留合理空位 |
| 墙大到不知道在哪里 | 首样提供回到中心、最新留言、列表；小地图仅在墙规模确有需要时增加 |
| 内容全部挤在砖面 | 砖面只预览，长话语进入稳定阅读面；接缝、阴影不穿过正文，不将全部正文绘成微小纹理 |
| 只能依靠拖动 | 给可点击的移动/分区定位方式和键盘路径，列表可完成读、回复和返回；W3C 2.5.7 的单指替代与键盘可用性分别检查 |
| 无限墙重复出现同一留言 | 装饰砖可延续，留言按稳定 ID 分配唯一位置；不同槽位不循环冒充新留言 |
| 漂亮弹层缺少基本行为 | 复用成熟 Dialog 的标题、焦点约束、Esc 与关闭恢复，真实内容和操作保持 DOM 语义 |

这些是研究建议和将来的验收点，尚未成为已通过的行为。动画幅度、时长、砖尺度与阻尼本轮不新增数值，后续只在 SYSTEM 维护经样本验证的参数。

## 复用与接入判断

- Palmer 作者仓库 [draggable-grid](https://github.com/joffreysp/draggable-grid) 和 [LICENSE](https://github.com/joffreysp/draggable-grid/blob/main/LICENSE)、Codrops [GridZoom](https://github.com/codrops/GridZoom/) 和 [LICENSE](https://github.com/codrops/GridZoom/blob/main/LICENSE)均核对为 MIT。正式采用前固定提交、保留声明并分别核对依赖和图像条件；本轮没有复制代码或生产素材。
- Before I Die 官方标注 CC BY-NC-ND 4.0；只借公共参与的设计思想，不将图片、模板或文本改造成本站素材。The Unsent Project 的留言属于第三方内容，不导入本站。
- Giscus 官方支持 GitHub 身份、提交/回复、主题与讨论映射。其 iframe 不是可任意拆为砖块的正文组件，公开读取、编辑/删除同步及每砖映射需在 T19 验证；不能仅凭 postMessage 元数据事件就假定已拿到每条留言正文。
- 实际工作区 `src/config/giscus.ts` 的 category/categoryId 仍为空，`Guestbook.astro` 因而显示留言未开放，`guestbook.astro` 目前为标题/入口页。这是本机代码观察，不是本轮实测远端授权结果。
- 沿用 Astro/React、既有 GSAP/Three 与 Giscus。先评估网格控制和 Dialog 复用，少量适配补砖位、稳定 ID 和原砖到阅读面的连接，不为二维墙引入另一套三维编辑器或完整主题。

## 验证证据与下一步

本轮官方网页/作者说明、仓库许可和本地工程检查已完成。UI/UX 技能定向检索 dragging movements 和 keyboard focus modal，与 W3C、Radix 官方说明交叉核对；默认 py 无可用运行时，随后使用已有 bundled Python 完成检索，未安装新运行时。

Palmer 初次建页、选页及截图有超时，随后复用同一 IAB 页面，通过浏览器页面 API 成功取得桌面初态、点击单元和详情终态。[原图与采集边界](evidence/u08-p14-2026-10-14-wall-research/README.md)已保存。没有连续录屏、拖动阻尼、手机触摸或性能数据，不能把作者描述当作这些验证通过。其他案例为官方材料核对，不写成全套现场体验。

建议下一轮仅制作独立“拖动墙 → 点砖展开 → 关闭归位”样本，明确使用演示留言；之后再验证真实 Giscus 读写和快照同步，缩放、搜索、新砖加入逐项推进。本轮研究不是开工或用户审美验收通过。当前无本片提交、PR 或发布。

官方辅助依据：[Pink Floyd — The Wall](https://www.pinkfloyd.com/albums/the-wall/)、[Giscus](https://giscus.app/zh-CN)、[Giscus Advanced Usage](https://github.com/giscus/giscus/blob/main/ADVANCED-USAGE.md)、[W3C Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)、[Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)。

交付检查：仓库文件检查通过（3077 个文件）；本片研究/证据两文档链接检查通过，改动文档的 diff 空白检查通过。全仓文档检查仍有 CONCEPT 第 9 行和 SPEC 第 97 行指向 SYSTEM 既有缺失锚点的两条警告，无本轮新增链接问题；没有修改并行首页规范来消除旧警告。两张研究临时浏览器页已关闭。
