# P01 F02 Quiet Assembly 工程交付

2026-10-14 · P01/P14 · R08/R12 · U05 · T03.04。本机候选冻结，待独立设计复核及用户验收，无提交/部署，不开始F03。

用户要求落砖美观且有艺术性，修改F02节奏、哑光着色、阅读交接；设计参数见[SYSTEM9.2.5](../../design/SYSTEM.md#925-全屏扩展与叠层接续)，原图、失败、节点和限制见[证据README](../../design/iterations/evidence/f02-quiet-assembly-2026-10-14/implementation/README.md)。

## 固定候选

[4342实际入口](http://127.0.0.1:4342/personal-homepage/#links) · `HomeJourney.BCioJqmj.js` · 1,174,036 bytes · SHA256 `9D210A639B05A2ECC38A4B99276759809678B5F968BCDA720FC17CD2321F9380`。20源文件哈希及与CQ对比见[冻结JSON](../../design/iterations/evidence/f02-quiet-assembly-2026-10-14/implementation/frozen-candidate.json)。6变更/新增，14保持。

## 工程范围

| 文件 | 改动 |
| --- | --- |
| wall-assembly.ts | 确定性弧形列相位、较短独立落程、渐进受光和轻微归位姿态 |
| RisingWall.tsx | 倒角/材质/受光，按可见布局压紧两种实例网格，完整状态缓存键加入画幅 |
| wall-material.ts（新增） | 原MeshStandardMaterial扩展局部边缘及纵向明暗，正常dispose |
| motion-ranges.ts | expand3H、wall2H，四卡与prepare保持 |
| home.css | 对应空间占位，增强阅读去背板，墙面辅助字#444740 |
| home-motion-ranges.test.mjs | 新区间、实际落程单调、确定性归位、精简集合四角覆盖 |

自研仅限现有Three实例与共享滚动驱动的适配；没有加入动效库或物理引擎。现有完整方案无法直接替代同实体窗口/玻璃/墙的同步约束。

渲染保持一个Canvas、同一墙目标、同一层级；新增点光无阴影，无额外目标或pass。缓冲容量897，但完成时真实提交桌面99、窄屏138个实例；承托网格同步压紧。局部着色是设计近似，不称真实接触阴影。暂停/反向仍由同一进度决定。

## 实际验证

- 测试初批8/10，修复断言取样和-0后10/10，再补集合覆盖用例最终11/11；日志均保留。
- check107文件零诊断（其后仅尺寸缓存键字符串与CSS字色）；最终构建15页及Pagefind成功。既有404及chunk体积警告保持。
- 24次采集含14次BCioJqmj桌面/390px正反、暂停、初中末、阅读及完成后改尺寸；最终CSS另一次阅读定向确认。同包0运行error，Three弃用/精度warn仍存在。
- 之前897全量绘制候选确认出现DOM及精确进度等待超时，定位后精简实例。只证明绘制量缩减，非帧率基准。
- Impeccable一次限定扫描[]，限定diff空白检查通过。执行者自测不等于独立或用户确认。

没有改其他栏目、依赖或服务配置。真机帧时间、系统减少动画、BFCache、context loss、所有直达/快滚及Someone返回未在本批重测；明确保留到交接，不扩大本片验证范围。
