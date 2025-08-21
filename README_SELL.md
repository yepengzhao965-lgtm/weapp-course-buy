# 课程售卖闭环（生成时间 20250819_091900）

包含：页面（home/detail/checkout/my）与云函数（login/ensureUser/courses/orders/prepay），并支持开发期 MOCK 支付。

使用：
1) 复制 `miniprogram/env.example.js` 为 `miniprogram/env.js`，填 `ENV_ID`，开发期 `MOCK_PAY=true`；
2) 逐个部署云函数：login、ensureUser、courses、orders、prepay；
3) Console 初始化：`await wx.cloud.callFunction({ name:'courses', data:{ action:'seed' } })`；
4) 首页选课→购买→收银台→支付。MOCK 模式会直接标记已支付并跳“已购课程”。
