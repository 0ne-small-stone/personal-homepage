# P01 · 封面入射角的实际接入（48轮）

2026-10-11。P01 / R12 / U03、U05、U14 / T03.05、T26.02、T27.01。源码 **3c19070**，仅PrismBeam.tsx、prism-ray.ts。最新用户：“入射光线的角度和月之暗面一致。”

## 参考与改变

沿用已登记的1500px官方封面，97个白光中心线样本拟合向右上14.2115394366°，RMS .245px；[测量原始结果](evidence/u03-p01-2026-10-11-48/cover-measurement.json)。这是现有图的测量精度，不是原作者工程参数。固定世界源(-12,-3.039038502,0)、方向(.969395925,.245502628,0)，射线经过世界原点，源不跟着模型或相机移动。内部与出射由既有真实几何Snell重新计算；n=1.45正面输出XY角−19.008540°。保留47光晕、实体、相机、半尺寸和章节。

## 实际验证

- [物理73样本](evidence/u03-p01-2026-10-11-48/physics.json)：实际BufferGeometry、scale.5，Y0–360°每5°，折射Snell、反射和状态有限通过；固定输入，无人为出射角。
- [浏览器15/15](evidence/u03-p01-2026-10-11-48/browser/checks.json)：实际最终Canvas，桌面1440×900和手机390×844初始投影均14.2115394366°；自然指针/滚轮改变姿态和内部/输出节点，源不变；普通/增强、暂停、首卡收光、反向和真正Becoming→返回均通过。没有设置姿态覆盖或时钟冻结。原47包体注入作旧源对照；旧包当前URL文件名仅是路由名，真实SHA见记录。
- 一次npm run check：51文件0errors/warnings/hints；npm run build：15HTML与Pagefind成功，既有大chunk和404路由警告保留。
- 最终 **HomeJourney.Dka1G72w.js**，1,179,114B，SHA256 **69496c5e967cc92e9fa3ff0c94fb40e4dde678d452d97f50152c1fb792b3702a**。相较47增114B。前后首屏资源一致：桌面13geometry/16texture/18program，手机13/11/10；47光晕仍5targets/6passes。实际自然求解均值桌面约.059ms/手机.073ms，首解.6/1ms，非硬件帧率结论。

## 图与体验

[桌面正面](evidence/u03-p01-2026-10-11-48/browser/desktop-front.png)、[手机正面](evidence/u03-p01-2026-10-11-48/browser/mobile-front.png)、[自然斜视](evidence/u03-p01-2026-10-11-48/browser/desktop-turn.png)。打开http://127.0.0.1:4335/personal-homepage/，观察斜向白光，滚轮/指针转动，暂停、反滚、进入Becoming再返回。

Chrome154 / DPR1 / SwiftShader，手机是视口模拟。IAB控制此前初始化失败，使用已允许的Playwright回退。执行者读图通过；用户审美、真实移动设备/硬件性能另验。此片没有七波长色散；46按新源接续，旧水平源的角度和临界夹具不作为现行预测。
