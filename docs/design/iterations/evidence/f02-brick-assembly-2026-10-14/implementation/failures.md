# 实际失败日志与处理

2026-10-14，保留真实失败，不作为最终通过样本。

## 初批测试

工具输出`9caa73`：8 tests / 7 pass / 1 fail。

```text
brick sequence starts after the square, lands bottom first and is entirely reversible
AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
actual   { x: -4.52, y: -1.4699999999999998 }
expected { x: -4.52, y: -1.47 }
at tests/home-motion-ranges.test.mjs:68:12
```

终点直接返回brickLanding的原坐标，不放宽断言；confirm-tests.log为实际8/8结果。

## 真实功能缺陷

- CGkAKIdJ空窗硬对角、右上点击丢query并回home-static：原图`desktop-a-no-bricks.png`、最初直达后的工具DOM（没有motion sample，console error为空）；集中视觉/同页capture处理后实测正常。
- DtZIxfp-：`sample-confirm-mobile-someone-return.json`实际scrollY4320；之前离开位置7780。修复后`sample-final-mobile-someone-return.json`7780。
- CSkMOuoJ：`sample-final-mobile-wall-reload.json`实际7780；实际刷新前已到8962。B2R4dj4a的`sample-deliver-mobile-latest-wall-reload.json`8962。

## 浏览器采集工具错误

```text
TypeError: Cannot read properties of undefined (reading 'now')
locator.setChecked(true) failed for selector internal:role=checkbox[name="暂停动态"s]
Locator diagnostics: no_matches, matchCount: 0
```

采样助手去performance.now，控件依DOM button定位，不修改产品语义。

助手首版等待了错误的区间值（expand起点误写9.5H，应为7.5H），报：

```text
locator.waitFor(attached) timed out for selector
body[data-home-motion-sample*='"rendered":{"progress":1,"index":5,"background":5,"intro":1,"prepare":1,"expand":0,"wall":0}']
```

后续两个采集超时分别为：reload刚触发深链恢复前读取旧scrollY导致发送错误方向；从0跨卡大滚动时，精确Lerper门槛尚未抵达，5s等待超时，随后实际DOM已在y5932/e=.3。按当前DOM重新取目标/保存，不改源码掩盖采集错误。

早期样本IDL inert为undefined，旧助手打印readable:true不能作为门禁验证；最终助手使用getAttribute与computed visibility。

宿主CIM进程查询在受限shell被拒绝（`4326d7`），未据此声明预览进程ID已实测，也没有结束任何服务。最终URL/bundle由实际浏览器DOM和磁盘SHA核对。
