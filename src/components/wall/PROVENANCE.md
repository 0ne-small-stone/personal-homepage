# 样本来源

2026-10-17 SL01：用户要求参考《光·遇》改留言星并补充访客留言。官方Friend Constellations说明用于研究明暗/状态含义（https://thatgamecompany.helpshift.com/hc/en/17-sky-children-of-the-light/faq/1119-what-are-friend-constellations-how-do-i-view-my-friends/）；SVG四芒、淡光晕和有限悬停为本站原创，不复制游戏图标/贴图。12条文字与3条示例回复为本次原创、本地loopback限定，明确标注示例、无公共评论URL，不向GitHub发布或伪装真实访客；真实读取/身份/提交仍由原Giscus承载。无新增库、字体或图片资产。

2026-10-17 SB01：破墙改为本站原创的有厚度分区几何、质量分段运动、有限阴影与相机穿入。复用已安装Three.js 0.186.1（MIT，不安装新包），渲染引擎源码/许可加入构建哈希；完整MIT声明在本文末尾，打包保留版权注释。微弱灰白颗粒为程序绘制，无照片/PBR贴图/新素材。Anime.js仅为时间编排参考，未引入源码；日常墙面仍是原DOM/CPU流场，WebGL只在有限破墙期间使用并释放场景资源。

2026-10-17 QS01：低幅度40格流场、有限Canvas几何破墙、断续斜轨SVG与相机附近程序化XYZ星域为本站原创代码。无写实贴图、位图、随机粒子雨、新字体或第三方素材。滚轮改变真实相机Z，装饰星按世界单元确定，不复制真实留言；页面静止时无场景循环。

2026-10-17 IS01修复：画圈识别支持稀疏采样/合并指针事件，保留圈尾余弧，原创事件控制器驱动圈数反馈与清理；未新增服务、依赖或素材。

2026-10-16 IS01：无限虚拟砖、ID稳定随机坐标、闭合鼠标圈识别、有限散砖过渡与分层星点为本站原创JavaScript/CSS/Canvas。只按输入和有限转场绘制，没有持续闪烁循环；真实留言星复用公共评论，装饰星不代表留言。沿用GSAP3.15.0与已有Giscus，无新素材、字体、服务或依赖。

2026-10-15 AF01：伪三维切面、灰白绘制表面、波动开关及四角投影为项目原创CSS/DOM，无位图、PBR贴图、噪声或新增字体。wall-fluid.mjs为小网格CPU适配，复用本站black-flow.ts的局部动量/压力投影/平流思路；数学原理核对Jos Stam的Real-Time Fluid Dynamics for Games（https://www.dgp.toronto.edu/public_user/stam/reality/Research/pdf/GDC03.pdf），未复制其C实现。React Bits（https://reactbits.dev/）仅作交互搅动/余流节奏参考，未导入组件或源码。CSS matrix3d由四角几何映射生成，砖与语义命中同源；这是艺术模拟，不宣称高精度物理或网页光追。

2026-10-15 W01：composer.css和giscus-theme.css为本站原创样式；原生iframe先加载官方light，再通过官方setConfig主题消息切换。自有CSS以构建时纯文字打包成CSS data URL，避免公开iframe读取loopback；实际运行已验证支持，官方Theme类型声明未列data协议，正式HTTPS部署需再核对主题路径。主题引用https://giscus.app/themes/light.css作为官方基础变量（Giscus/Primer，MIT，版权说明见该CSS），不复制组件/服务端代码；官方useThemeChanger在新主题失败时保留原light。服务端撤回首样的主题CORS改动，无新增依赖、身份或写入代理。

本样本的HTML/CSS、错缝布局与状态连接为本站原创，无第三方图片或字体文件。2026-10-14真实接入片已移除浏览器产物中的演示记录；保留的messages.js只作历史源，不再导入或打包。公开GitHub评论归各作者，身份/写入由Giscus原生控件管理，不由本站保存访客会话或代理写入。

行为参考：Palmer Draggable Grid / Joffrey Spitzer，https://tympanus.net/Tutorials/PalmerDraggableGrid/ ，本片未复制其源码或素材。

运行复用项目已经安装的GSAP3.15.0（Draggable、InertiaPlugin、Flip）。打包保留GSAP版权头与标准许可链接：https://gsap.com/standard-license 。未新增包或将组件当作单独库分发。

浏览器原生dialog承载阅读与留言区，页面文字沿用系统苹方优先栈。真实读写由既定Giscus承载，应用安装须用户授权；当前验证状态见本片记录。

真实接入复用giscus.app/client.js及其公开分类/讨论读取API，未复制服务端代码。来源与能力边界见docs/technical/REFERENCES.md的2026-10-14接入记录；测试替身仅在4361独立测试地址，标明非真实留言，不进入4360产物。

## Three.js MIT license

The MIT License

Copyright © 2010-2026 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.


2026-10-18 ES01：世界八分区抖动星点、留言最佳候选分散/离屏回收与移动距离渐显为本站原创程序，无新增素材或依赖。每条留言保持一个活动星位，星空位置可补入更新，原墙位与公开记录保持。
