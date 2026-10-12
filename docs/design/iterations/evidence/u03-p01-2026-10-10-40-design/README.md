# 40轮 · ALCHE 尺寸研究与独立复核

日期：2026-10-10；关联 P01/R01/R12/U03/U05/U14/T03.01/T03.05。

## 原站依据

- `measurements.json`：源站公开模型的SHA-256、完整边界/前平面外环及内孔边界、三轴尺寸、同相机公式投影。用GLB POSITION/indices读取几何，提取前端平面三角面边界，未把GLTF节点位移带入实例。
- 原站当前HTML仍引用17轮研究的 `index.astro_astro_type_script_index_0_lang.Cn_goiN_.js`；MainLogo取Alche_A.geometry，局部3×父4.3；GL.resize取canvas容器clientWidth/Height。
- 原始scene.glb仅在临时调查目录中，未加入应用、public或本站资产库。应用重建规则三角环；不采用ALCHE A字底部缺口。
- `alche-desktop.jpg`：真实ALCHE序章，窗口1440×900、DPR1、scrollY0；因经典滚动条，canvas实际1425×900。源码相机有指针视差，截图不声称零offset的模型投影量测。
- `alche-mobile.jpg`：真实ALCHE手机布局，窗口390×844、DPR1、scrollY0，canvas实际375×844。同样只作为视觉参照；不是手机硬件性能验收。
- 原站声音选择“サウンドなしで進む”，未启用音频或修改材质调试控件。

## 解释

用户要求的是实际大小和比例，因此旧半尺寸/放大15%/横向加宽/孔洞.65等手调系数被替代。外轮廓、内孔和深度分别校准，再以相同有效canvas/相机验证屏幕占比。亮部和柔光不计入实体边界。

测量公式采用零指针偏移、单位姿态、稳定首屏zoom。本站保留中心锚点，不照搬原站对象Y偏移；复刻比例的误差口径见[40轮施工单](../../u03-p01-2026-10-10-40.md)。尺寸实施及独立复核结果待追加。

## 本片独立复核

实际候选 `HomeJourney.CRy09A9T.js`，1,174,564字节；SHA-256 `325b1f1d7783dda32afce11f270f20a76412180de42f5a38d8430c006db85cfc`。

- `before-home-default.jpg` 为39基线默认1195×780，供历史留存，不与1440参考作像素等大对照。
- `new-desktop.jpg` 为真实新版首屏1440×900、DPR1、S0、canvas1425×900；`new-mobile.jpg` 为390×844、S0、canvas375×844。实体占屏与原站相近，本站中央锚点保持；原站A字底部缺口未复制。
- `new-mobile-paused.jpg` 为实际按钮切换后的暂停画面，体量和居中保持、无裁边；随后已恢复动态。
- `new-mobile-turn.jpg` 为原生滚动到S506的运动姿态，柔光连续，未再次出现前后光片；它不是固定85°照片。随后滚动经过音乐入口S2632，再用真实序章入口返回。
- 另已实际打开工程初批 `../u03-p01-2026-10-10-40/initial/new-desktop-60.png` 和 `new-mobile-85.png`，检查厚度、孔洞及连续光晕；固定姿态的口径见工程checks.json说明。
- 工程checks.json读回10/10：完整实体/孔比例、同相机投影、首卡零光晕pass、原生反向恢复、当前Wall接管、手机quiet。正面投影误差约.30%/.28%，所有case错误数组为空。

本批通过，无新增美术修正；已通知首页开发最小保存。40只完成尺寸校准，全屏轮廓展开、用户审美确认及真机性能均另记。

源码819fc0a、单次check44零诊断及build15路由已读回。`final-homepage.jpg`为最终默认1195×780、DPR1、S0，实际CRy09A9T、Canvas1、控制台error0。原站临时研究页已关闭，测试视口已重置。89份设计/技术文档链接检查及git diff --check通过（保留既有行尾提示）。
