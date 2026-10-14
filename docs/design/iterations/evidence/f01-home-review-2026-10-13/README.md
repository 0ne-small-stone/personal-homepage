# F01 首页光谱传输：独立设计复核

日期：2026-10-13。范围 [F01 功能卡](../../homepage-feature-acceptance.md)，仅一批桌面/窄屏实际浏览，不重新执行开发方整套数值或性能测试。

**后续用户验收未通过：**旋转光线不变，色散和光晕缺失。下面是旧候选复核，不再作为当前可交付结论；旧指针样本只读stage=done，缺乏新代次/姿态对应，验证不足。独立滚轮复现已存`repair/before-scroll.jpg`与`repair/before-rotating-section.jpg`，玻璃侧面变化而光束仍固定。修复与重新验收见[任务](../../f01-rotation-light-repair.md)。

## 实际版本

- 完整首页 `http://127.0.0.1:4342/personal-homepage/`，并非 spectrum 或 home-preview 独立样本。
- 实际岛组件 `HomeJourney.IFR9F3Dv.js`，SHA-256 `38a0b5815948be9faa7887d1157c82d6c43b246d9ec250b161e4eec5675c4c30`。
- 同页有 PersistentPlayer 组件，是并行音乐工作区的现状，不在 F01 宣称新增或完成。

## 已实际核查

| 样本 | 操作 / 结果 | 证据 |
| --- | --- | --- |
| 桌面首屏 | 实际白入射、较窄连续色散及反射分支；初次读取 stage=native，不能把该帧写成已全部收敛 | desktop-initial.jpg |
| 暂停静态 | 真实点击暂停，按钮变“继续动态”；随后 DOM 读回 home-quiet=true、spectralStage=done，无 spectralError，静态光路可见 | desktop-paused.jpg |
| 继续与指针 | 继续动态后一次原生指针拖动，背景/视角响应；该帧 stage=done。仅此输入，不当作极端姿态扫测 | desktop-after-pointer.jpg |
| 退出项目区 | 点击真实章节入口，Afterimage 前景完整、光谱效应退出，未穿入标题和卡片 | desktop-projects.jpg |
| 回首页及窄屏 | 回到序章，再 resize 390×844，scrollY=0、chapter=intro、stage=done；一个 Canvas、无 spectralError、无横向溢出，导航与字标可读 | mobile-intro.jpg |
| 最终桌面候选 | 恢复1280×720后stage=done、无spectralError，保留在用户验收入口 | desktop-review-final.jpg |

截图为原始 IAB 输出，无修图。临时 viewport 最后已恢复。此轮未修改首页应用代码。

## 设计判断与边界

允许作为 F01 的用户验收候选，不新增美术修正。画面能区分新传输与原先宽七色带，真实首页接入成立；用户是否满意光质、亮度和接缝须由用户验收。

玻璃边缘仍有少量颗粒亮点；不描述成完全无噪或最终审美通过。额外白色分支是本片实际光路画面，不是恢复已删除的装饰白弧线。模型仍有离散光谱、有限采样和单散射近似，不称无限连续或完整无偏渲染。

本次设计复核没有单独计时冷启动，也未测真实手机、连续快速拖动、全部路由生命周期、系统减少动画设置或失败路径。工程侧另有一笔390×844 CSS px完整路由重载到`stage=done`的总耗时，包含页面与shader编译，口径见[首页工程记录](../../../../technical/iterations/u03-p01-2026-10-13-53-implementation.md)；它不是单独光学收敛时间。并行浏览标签也可能影响GPU，因此不从本轮截图间隔推断收敛耗时/帧率。设计复核不替代用户验收，下一功能F02仍未开工。

## 第二版及局部可读性修正

第二版生产构建的完整桌面、暂停/继续和390×844 CSS窄屏检查记录见[confirmation](confirmation/README.md)。唯一追加调整是在radio活动章节说明文字后增加无硬边的径向黑色柔衬，不改变光学渲染或采样。最终radio实图在[radio-final.jpg](confirmation/radio-final.jpg)：白色入射与彩色出射仍可见，文字和入口按钮保持可读。该图来自最终生产包`HomeJourney.ac_CG-U3.js`，SHA-256 `60b248b58990a2076bba3e756a8bbe08a3a632f5092320ad59fa593d4d133b28`。本机复核通过后交用户重新验收；用户通过前不开始F02。
