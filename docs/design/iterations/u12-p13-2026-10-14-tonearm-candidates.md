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

## 当前素材之后的第二组选型

2026-10-14 用户继续问“唱片臂还有更好看的吗”。本轮只提供外观候选/直观对照，不直接覆盖已接入的原创金属图或落针几何；沿用P13/U12/T25.18。

- P13-TONEARM-REF-06：Rega RB3000，[官方产品页](https://www.rega.co.uk/products/rb3000)和[1200×742官方图](https://www.rega.co.uk/assets/uploads/heroes/_gr-1200px/rb3000-hero-01.jpg)实际读图。抛光金属、一体式细长直臂，与当前简约黑灰更相称是执行者建议，不是用户选择。官方明确手工抛光臂管；不引述听感/价格/购买建议。
- P13-TONEARM-REF-04再次对照：SME M2-9R同一2560×1809官方图实际读回，细银弯管/黑色镂空唱头，偏复古器物方向。
- P13-TONEARM-REF-05：Ortofon AS-212R，[官方产品页](https://ortofon.com/products/as-212r)和[864×864官方图](https://ortofon.com/cdn/shop/files/AS-212R.png?v=1696234529&width=864)实际加载，银色弯管、黑银紧凑轴承座。该图没有装唱头，不能当作完整播放素材。此前dsc0903图是整台唱机环境照，未作为主对照。
- Reed 3P实际官方页面及两张900px轴承近照已查看，木管+精密金属配重，但机械座仍复杂且不是完整俯视造型，因此退出本组三个优先候选，不误把页面材质色样的Reed 2A当作3P。
- 对照页/截图/images.json见[evidence/u12-p13-2026-10-14-tonearm-next](evidence/u12-p13-2026-10-14-tonearm-next/index.html)。Rega在localhost内嵌首次加载失败，改用已成功打开官方图的原生浏览器截图作研究预览，没有下载原始远程图；SME/Ortofon仍官方远程原图。最终三图loaded=true/尺寸读回通过，首批失败如实保留在记录中，不写为全程无问题。
- 体验：http://127.0.0.1:61173/personal-homepage/music/tonearm-next/。仅新增研究静态页，不构建应用、不重启服务、不改变首页/当前播放器。原厂图的应用再利用许可仍未核验；选定方向后要制作可使用的统一俯视资产、重新校准落针，不把这些侧视研究照片直接当成本站正式素材。

## 艺术化唱臂参考

用户随后询问艺术化处理的唱臂，研究中插入“盘未完全离套就闪到包装前”的修复，后者已优先完成。艺术研究仍沿用T25.18，仅来源/风格比较，不再次换素材。

- P13-TONEARM-REF-07：[Side One作者仓库](https://github.com/mintdotgg/bookshelf)的Three.js器物风格，已重新读回本对话此前真实截图side-one-desktop-playing-test-audio.png；圆润曲臂和整体唱机由三维画面表现。图片为此前合成音频验证场景，不是商业音源证明，斜视/部分遮挡不能视为现成俯视透明唱臂资产。原主项目许可仍未查到，不宣称可直接复制。
- 原P13-TONEARM-REF-01：[Codrops Interactive Record Player](https://tympanus.net/codrops/2016/06/15/interactive-record-player/)的SVG图形化唱臂，原作者官方InteractiveRecordPlayer_3.jpg实际浏览器加载890×512并查看，紫色曲管/白色枢轴和唱头，明显简化器物细节。不是新增替换，也不将此前用户否决的本站银色矢量适配重新记为选定。
- Dribbble原作者R P Jadeja《Retro Vibes in 3D》页面描述Spline和风格化光影；网页搜索读到作者描述，但实际浏览器遇到人机验证，未绕过或请求用户处理。Ana Carolina的Vinyl Player同样仅读到原作者说明；未把未实看的图当作已验证推荐。
- 结论：存在三维器物和图形化两类已实看的艺术方向；结合本站当前黑灰/真实黑胶，优先建议保留材质厚度的半写实三维，方向建议不是用户选用/新素材接入完成。原唱臂保持，具体原创变体或资源取得留待用户进一步选择。
