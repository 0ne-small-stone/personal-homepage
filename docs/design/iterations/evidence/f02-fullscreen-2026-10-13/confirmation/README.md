# F02 D1–D3 独立定向确认

2026-10-13，设计侧在集中修正后完成一次定向确认。**D1–D3修正通过本轮独立检查，F02进入待用户验收；不代表用户已通过，也不代表所有设备和逐帧性能已验证。** 首轮失败证据保留在相邻 `independent/` 目录。

## 固定候选

- 实际入口：`http://127.0.0.1:4342/personal-homepage/?opticsDebug=1`；用户体验入口可使用 `http://127.0.0.1:4342/personal-homepage/#links`。
- 页面DOM与磁盘：`HomeJourney.BZgdJJ3A.js`，1,168,425 bytes。
- SHA-256：`0A8C2C93C242DFE1963CB479CAF18C251EE809CF024DCA448DF1094C05821799`。
- 独立读回修正候选元数据列出的11个源码/测试文件，哈希均匹配；未在验收中改动源码或重建。交接消息曾误写12，文件数量以元数据实际数组为准，不影响零哈希差异的结论。
- 使用新建后台IAB标签，1280×720及390×844 CSS视口；原生滚动、导航实际操作。6份原图及DOM样本已保存，结束时关闭临时标签、reset视口。

## 定向结果

| 检查 | 实际证据与结论 |
| --- | --- |
| D1 共形衔接 | 桌面y5896、expand=.275，玻璃侧面/倒角与墙窗一起展开，原先独立露出的中央尖角已消失；`desktop-quarter.jpg` |
| D2 砖缝连续 | 同一桌面位置和窄屏expand=.25均未再看到旧的内部对角折线或阶梯扭折；`desktop-quarter.jpg`、`mobile-retracted.jpg`；对应`homographyValid=true` |
| D3 轮廓质量 | 小窗与近全屏轮廓平滑，保留圆角/侧面和附着的柔晕，原硬切像素阶梯已消除；`desktop-quarter.jpg`、`desktop-nav-boundary.jpg`、`mobile-retracted.jpg` |
| 桌面完整覆盖 | 实际墙面充满内容画幅，无残余黑角；rendered expand=1、wall=1，`desktop-full-cover.jpg` |
| 窄屏完整覆盖与反向 | 390×844实际全屏阅读后向上滚2.5页，收回到y6852、raw/rendered expand=.25、wall=0，墙体不在窗口外残留；`mobile-full-cover.jpg`、`mobile-retracted.jpg` |
| 返回首屏 | 点击序章后y=0、expand/prepare/wall=0，几何恢复原边界、scale=.5、quaternion=[0,0,0,1]；玻璃/柔晕保持，无残余墙贴片；`mobile-intro-restored.jpg` |
| 溢出与错误 | 窄屏文档内容宽375px小于390px视口，无横向溢出；独立标签console error列表为空，见`console-errors.json` |

## 保留的观察与限制

- 桌面expand=.75时，明暗边界经过右上The Wall按钮，仍有分段反色/瞬间对比变化，见`desktop-nav-boundary.jpg`；最终亮场文字清楚。列作用户体验时的观察项，未宣称逐像素对比度合规，不再开启额外美术循环。
- 此轮仅定向验证D1–D3及关联覆盖、反向、首屏恢复。首轮的重载、Someone离页返回、quiet路径证据属于CIZrgdwT；没有将它们冒充本包完整重测。当前工程对相关门禁的验证见执行者修正记录。
- `portal`诊断有40ms节流且在升墙完成后停止更新，因此完整墙样本里可能保留较旧的renderedWall/target；当前body、rendered与实际原图同时解释，不能凭过期portal字段声称当前仍在中段。
- 6张截图是有序动作后的真实原图，不是逐帧视频。模拟390px不是实体手机性能测试。系统减少动画偏好、无HDR设备、BFCache/context loss未专项验收；不提供FPS承诺。
- 未提交、未部署。留言功能仍显示“暂未开放”，这属于后续F08，不将本次转场验收写成留言业务完成。

## 给用户的体验步骤

1. 打开 `http://127.0.0.1:4342/personal-homepage/#links`，定位常用网站末卡（左下04）。
2. 缓慢向下滚：观察玻璃内部墙窗出现，玻璃轮廓铺开，再由同一墙面接管全屏并进入The Wall。
3. 展开到一半时反向滚动，再向下继续；观察能否自然收回和恢复。
4. 到墙面后向上收回，或点击左下00返回序章；检查玻璃是否恢复、导航是否易读。
5. 如方便，在手机上体验同一路径；最终审美、节奏与使用是否接受由用户确认。

当前固定候选停止修改，等待用户反馈；用户未确认前不开始F03。必要反馈修复仍属于F02。
