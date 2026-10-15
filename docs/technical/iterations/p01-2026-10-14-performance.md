# P01 · 首页运行性能修正

2026-10-15 主站集成与发布状态见[本轮验收](../acceptance/home-performance-2026-10-15.md)；以下未提交/未部署与固定包为原候选阶段快照。

2026-10-14 / R12 / U03、U05、U14 / T03、T27。用户指出首页卡顿，本片优先于已授权F05；两片分开留证。

## 原因与实现

BdZlSJh6实际静止25.257秒增加1260场景帧；玻璃透射和柔光链反复绘制。Drei仅检查材质visible，父mesh隐藏仍可能捕获整个场景。home-motion每帧重复目录查询及语义状态写入。

复用R3F frameloop/invalidate/setFrameloop与原单一时钟。新增FrameActivity判断实际相机、可见玻璃和滚动收敛，HomeFrameLoop在活动时使用always、收敛后demand；输入/异步进度/加载/resize/返回唤醒，暂停/quiet/隐藏优先。只在模式变化时切换，避免重置Clock。数值归SYSTEM本片记录。

已停止后的首次长dt排除空闲时间，其他活动慢帧保留真实dt；Lenis累计同一有效时间，避免第一次滚轮补算几十秒。隐藏玻璃矩阵不维持尾帧，材质visible同步mesh；全部透射参数、样本数、DPR、AA与光晕保持。目录节点缓存，identity/章节/wall/portal属性变化时才写入；保留焦点保护。

监听由AbortController卸载，model.invalidate与诊断清理。无新依赖、Canvas、Renderer、target、纹理或第二常驻ticker；不改独立栏目或清空用户存储。

## 固定候选与验证

4342/HomeJourney.DkmdTjgT.js，1,185,142 B，SHA256 `49D504E588813EE4B2F84CED44C1833E4D9E2927DDBB46870D2962D368105AF5`。相对F03原28源22保持/6修改+3新增记录，共31源；三卡、F03字标/揭幕shader与F02小砖/上垒保持。20测试、check115零诊断、build15HTML/Pagefind成功。

原图、前后计数、集中修正、CLI/受限环境/类型失败日志和未测范围见[实施证据](../../design/iterations/evidence/home-performance-2026-10-14/implementation/README.md)。工具浏览器约1s帧调度节流，不以调度、CPU提交耗时或空闲帧减少保证真实设备FPS/GPU性能。独立复核、用户体验、真机及部署另记；无提交/发布。固定后供F05接续。

最终DkmdTjgT窄屏墙231.331s静止新增场景/renderer帧均0；桌面/窄屏完整130/162砖，隐藏透射false；暂停/反向、实际Someone返回不揭幕、F03手动展开及quiet模拟已定向核对。路由完成前的误back、非原子采集与完整焦点/自然时序未测边界如实保留。
