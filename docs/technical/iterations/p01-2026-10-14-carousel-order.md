# P01 首页三卡重排工程记录

2026-10-14 · P01/P14 · R01/R12 · U03/U05/U07 · T03.02/T03.03/T03.04。人类最新任务优先于F03交接；本片只实现轮播顺序/删除，F03以此基线接续。

结果：album（A Moment Remains）→radio（Echoes）→projects（Afterimage），随后wall。旋转区links删除，顶栏/links/入口沿用。home-chapters派生homeWorkChapters，DOM、三维媒体索引及workCount共用；章节高亮和wall索引去除固定4/5；删除网站卡CanvasTexture绘制与监听；旧移除章节返回快照落到序章。

7个文件变更：home-chapters.ts、motion-ranges.ts、WorksScene.tsx、home-motion.ts、home-return.ts、index.astro、现有home-motion-ranges.test.mjs。没有改依赖、服务或其他栏目；F02实例/材质/底边遮罩源保持，仅卡数使入口绝对区间前移1H，展开3H与尾段2H保持。参数归SYSTEM9.2.5。

[4342实际入口](http://127.0.0.1:4342/personal-homepage/#album)；`HomeJourney.Buuw_zpt.js`，1,172,722 bytes，SHA256 `61BE46FD1E48E8C46906AA36D2C901D7F165538BC3E8C9D9FDF734CF058AA58D`。原20源清单16保持/4变化，另补3个当前改动文件哈希，见[冻结JSON](../../design/iterations/evidence/home-carousel-order-2026-10-14/implementation/frozen-candidate.json)。

11测试、108文件check零诊断、15页/Pagefind构建通过；实际9个DOM状态、相册进入/返回、直接页面截图确认桌面末卡及390px首卡，单次Impeccable检测[]。两个墙门禁等待超时、过早CTA点击及原生截图/新标签默认尺寸偏差保留；后来实际结果核实，不称整批全绿、独立通过或量化性能通过。原404/chunk警告保持。

[原图、节点、采集边界](../../design/iterations/evidence/home-carousel-order-2026-10-14/implementation/README.md)。候选已冻结，待独立设计/用户体验，无提交或部署。F03授权保留，下一功能仍按其施工卡单片接入。
