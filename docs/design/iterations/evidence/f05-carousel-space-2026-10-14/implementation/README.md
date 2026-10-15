# F05 · 实施与执行者证据

2026-10-14。P01 / R12 / U03–U06、U14 / T03.02、T26.02、T27.01。**工程候选冻结，待独立设计复核与用户体验。**本目录不代表用户或独立验收通过。

## 版本与体验

- 普通入口：<http://127.0.0.1:4342/personal-homepage/#radio>。滚动经过相册→音乐→项目，观察卡片外的暗格、曲面网格与灰光；停驻、换向、进入墙再返回。
- 固定包BNuf11DH，1,188,708 B，SHA256 `9CEDA3C79445602902E5038F3682A6B0781F8B50A361D89F076239406B9773F6`；[34源哈希](frozen-candidate.json)。直接性能基线31源5变化/26保持+3补录；SceneBackdrop以前未入31源清单，本轮补录并修改，不能把补录都叫新文件。旧F03比较另列。
- 初样BNqPrlTY做一次桌面/窄屏图检；_ZhzwPha集中修正玻璃长尾、统一参数；BNuf11DH只追加诊断坐标，视觉参数与上一包一致。不同包不混称最终截图。源资源、F03、三卡、小砖/向上垒墙保持；无新依赖、Canvas/Renderer/target/pass。未提交/发布。

## 首样取舍与开销

q读取共享连续index，三个中心为0/.5/1；远格亮度.52，104/96 CSS px稀疏曲网、.048/.048灰光/网格强度，显示编码峰值≤36/255；主域桌面(.72,.36)→(.5,.30)→(.28,.36)，手机.62→.38。文字与上下控件软暗化，原黑底保持。实际值唯一归SYSTEM9.2.7；非ALCHE测量值。

原CanvasTexture保留，动作只更新uniform；没有逐帧Canvas重画。首样图检确认层次存在，不加第二轮美术调参。旧玻璃慢回正导致停驻连续绘制，集中修正仅冻结无输入的惯性长尾：相机/章节/窗口仍收敛，后续输入不补算空闲时间。

## 实际观测

| 范围 | 证据与结果 |
| --- | --- |
| 初样桌面/390px三卡 | desktop-*、mobile-*六中心原图已看；q=0/.5/1对应同一光域，纹理UUID在同尺寸内保持。文字/CTA可读，未见硬灯斑/白线/地平线；背景投影四角在画外 |
| 停驻与恢复 | idle-mobile.json：_ZhzwPha手机项目静止114.278s，场景与renderer帧增量均0；final-mobile-first-wake真上滚后running=true、q≈.985；再到音乐后running=false |
| 暂停/返回 | final-mobile-paused：新增层0、原静态层1、demand；恢复后实际进入Someone并后退，final-mobile-return back-forward/y2632/index2/q.5、requested=false，焦点返回nav-about |
| 连接/换向 | 原生上下滚及快速换向有记录；一些紧接输入样本仍为旧/起始相位，不冒称完整中段录像。状态函数边界/反向测试与实际回到q.5一致 |
| 墙接管 | final-mobile-wall-approach prepare≈.928/expand≈.993时新增权重0；完整162砖/coveredtrue、背景visible=false、透射false、demand。最终普通包desktop-wall-normal完整130砖/权重0；该截图仍在输入唤醒窗口，不当作已停帧样本 |
| F03 | delivery-loading-opening手动p=.55，随后complete同glassId/geometryId，临时copies4/activefalse/disposedtrue/size[]。seek是本机受控采样，不是自然时序录像；完成后的受控hold样本不作为自然滚动证据，随后退出参数回普通URL确认 |
| quiet/普通浏览 | delivery-quiet本机减少动画模拟，新层0/原层1、demand；delivery-ordinary fallback且背景/loop诊断清理，普通DOM可读。不是实际系统偏好或禁JS测试 |
| 最终正常包 | delivery-radio-normal index2/q.5、真实cards/camera数据、demand/runningfalse；实际截图已看。末次追加坐标只影响诊断，先前原图保持历史，不伪造当时未采的卡片坐标 |

browser-samples.json与每图JSON记录URL、视口、bundle、滚动、进度、背景/四角、生命周期；BNuf11DH诊断增加实际卡片/相机。读取与截图非原子，不能把轻微相位/姿态差当同帧比较。baseline-radio是过早reload恢复序章的采集，baseline-radio-center才是DkmdTjgT音乐中心。PNG未裁切/调色。

最终清单32组，其中11组BNuf11DH；delivery-album-normal、delivery-radio-normal、delivery-projects-normal、delivery-mobile-projects-normal补齐最终真实坐标和自然模式停驻。sample-checks.json对20个背景可见样本的投影四边形验证四角，失败0；按不透明a1/ed文本与背景上限24的数学对比下界为6.008/13.259，不代替同帧像素或真实设备审计。34源读回0漂移、磁盘包SHA匹配；正常无测试参数入口已留给用户，临时viewport已reset。

## 验证与边界

tests-final.log 24/24；check-delivery.log 122零诊断；build-delivery.log 16HTML/Pagefind。五相关源Impeccable[]，末次只增诊断，定向检查另记；源码diff检查通过。无应用error；原Clock/编译精度与chunk/404提示保留。

真实手机/GPU耗时、实际OS偏好、隐藏/BFCache专项、禁JS、完整视频/逐帧、长时内存和线上网络未测。其他栏目负责人在共享主目录新增类型/zh/about路由，被标准构建读入；本轮不修改/复制其功能。常用网站顶栏保留，相册独立样本整合不在本片。

冻结后交独立设计与用户体验，停止F05修改，不启动F06/F07。工程记录见 `docs/technical/iterations/p01-f05-2026-10-14-carousel-space.md`。
