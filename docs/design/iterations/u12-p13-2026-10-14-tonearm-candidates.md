# P13 唱臂替代候选

本文件保存研究过程。用户后续指出旧臂仍未替换，现已用原创生成的写实金属透明图正式替换并重测落针，见[接入片](u12-p13-2026-10-14-album-choreography-revision.md)；下文“应用保持原图”为当时研究阶段的事实，不能当作当前状态。

- P13 / R04、R12 / U12 / T25.18；2026-10-14。
- 用户截图指向现有Vinyl Vue唱臂，希望寻找更好看的替代。主技能frontend-design；本片只研究与提供候选。
- 用户已看两款矢量适配对照，明确要求继续找更写实的金属唱臂；此前A/B退出当前优先方案，不能按执行者先前建议替换。
- 当前应用为public/music/vinyl-vue/tonearm.webp，由VinylTurntable消费；落针/进度/暂停仍使用既有turntable-geometry。换图须重新校准枢轴和唱针坐标。

## 已查看的首批候选（不采用）

| 候选 | 原始来源与实际改造 |
| --- | --- |
| A 银色细曲臂 | [Codrops RecordPlayer](https://github.com/codrops/RecordPlayer)原index.html的icon-tonearm路径，适配黑灰金属渐变、枢轴与唱头细节；本站适配预览，不是原站截图。用户要求更写实，不采用。 |
| B 极简直唱臂 | [Liotou/obsidian-vinyle](https://github.com/Liotou/obsidian-vinyle)main.js中的40×150 SVG，仅提取图形并改配色，不运行Obsidian/AppleScript代码或接入音频。LICENSE实际读取为MIT。用户要求更写实，不采用。 |
| Side One | 原作者仓库及本机既有studio-lower-tonearm图读回；其当前斜视三维唱机不适合作为本站俯视透明图直接替换，未采用。 |

Codrops仓库README允许个人/商业项目集成与改造，禁止原样再发布；[当前官方许可页](https://tympanus.net/codrops/licensing/)对未另有说明的demo列MIT。登记项目本身条件，不用通用页自动覆盖旧仓库说明；未采用音乐、字体或专辑图。

原始文本保存到忽略目录.local-tools/music/tonearm-research，未执行远程代码。首批候选对照页/music/tonearm-options/的三图全部加载并实际读图；视口恢复后首次截图未同步，随后AX/截图同步，有效图保存到visualizations/tonearm-options-2026-10-14/comparison.png。

## 后续方向

继续寻找高清真实金属俯视唱臂与可授权模型，关注银色曲臂、配重/轴承/唱头细节；官方产品照片作为视觉参考与可复用资源分别登记。当前未替换正式资产，选择与落针几何验证另记。

## 写实候选已核对

- P13-TONEARM-REF-03：[Geug的Technics SL-1210MK2模型](https://sketchfab.com/3d-models/technics-sl-1210mk2-41f8370f7899443488a9263de55601c0)。原作者页面实际标注Download 3D Model、CC Attribution、22.3k triangles；实际加载/读回俯视PBR银色曲臂及轴承/配重。网页研究抓取403后在浏览器公开页面读回，不推断实际下载成功；未登录、下载模型或验证独立唱臂拆分。模型保留为可进一步取得/渲染的候选，不把公开viewer截图用作透明正式素材。
- P13-TONEARM-REF-04：[SME M2-9R官方产品页](https://sme.co.uk/product/series-m2-9r-2/)及[2560×1809官方图](https://sme.co.uk/wp-content/uploads/SME-Tonearm-M2-9R-Series-22102200.webp)。图像实际加载/读图：哑光银管、精密黑银轴承、圆柱配重、镂空唱头，比矢量候选更接近用户要求。只作金属外观/材质参考，未核验照片再利用许可，未下载/加入网站资产。
- Yamaha TT-300：作者说明独立可动唱臂、2k/4k PBR和CC Attribution，但本轮未实际读图，不作为优先审美结论。
- NicePNG素材作者链不明；Vecteezy候选明确AI Generated及免费许可限制，未作为可直接替换的正式资源。
- 新两项写实候选研究完成，正式选用/资产制作/落针验证仍未实施；当前应用保持原Vinyl Vue唱臂。
