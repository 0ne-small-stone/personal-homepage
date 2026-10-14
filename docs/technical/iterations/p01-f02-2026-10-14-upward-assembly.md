# P01 F02 向上垒墙工程交付

2026-10-14 · P01/P14 · R08/R12 · U05 · T03.04。状态：本机候选冻结，待独立设计与用户验收；未提交/部署，不开F03。

用户最新要求砖直接从下向上垒。复用原实例墙、标准材质扩展与共享滚动状态，最小适配4文件：wall-assembly删除上方spawnY、改局部短距离上移；RisingWall简化缓存键和生成逻辑，增加按最终底边的实例缓冲；wall-material对砖/承托作独立底边裁剪；现有测试检查方向、上移范围及下层先完成。视觉参数归[SYSTEM9.2.5](../../design/SYSTEM.md#925-全屏扩展与叠层接续)。

## 固定候选与资源

[4342入口](http://127.0.0.1:4342/personal-homepage/#links) · `HomeJourney.B46QOkX1.js` · 1,174,388 bytes · SHA256 `ACFB4CDD9ADA074F31375EAEA4BA9AF57972A44734A43C2493499681722C18B8`。20源哈希与4变化/16保持清单见[冻结JSON](../../design/iterations/evidence/f02-upward-assembly-2026-10-14/implementation/frozen-candidate.json)。

实例容量897，可见参与集仍桌面99/窄屏138；砖和承托各897个Float32底边数值，共7,176 bytes。已有材质hook增加varying/片元discard，缓存键独立，材质随几何卸载；同Canvas/目标/pass预算，无新依赖。整个group不位移、不加物理或光谱。诊断旧字段`falling`此版仍表示未完成动作实例数量，实际方向已向上；没有产品文案叫它下落。

## 实测与边界

11测试通过；两次check108文件零诊断，最终15页/Pagefind构建通过（既有404/chunk警告保留）。首样发现新砖覆盖下层，集中修正底边裁剪；实际27份采集含4旧样、23最终包，其中16对齐样本与7延迟/收敛样本分别记录。桌面同ID448连续y增加、桌面/390px暂停、阶段初中末、阅读99/138砖及反向回退有证据。

重载/精确等待工具超时、非原子帧和未收敛样本保留，不声称整套全绿或量化帧率；实际控制台采集为空。最终尺寸恢复阅读实际99砖，但resize初采本身未完成。Impeccable单次限定扫描[]，限定diff检查通过。

完整原图、实际节点、差异及未测真机/减少动画/BFCache/返回分支见[实施README](../../design/iterations/evidence/f02-upward-assembly-2026-10-14/implementation/README.md)。其他栏目/配置/服务未修改，BC独立结论仅历史。本片等待独立复核与用户确认，不扩展下一功能。
