# 登录完整补丁包（手势触发修复版） - 2025-08-19

包含：
- miniprogram/app.js
- miniprogram/pages/profile/profile.(wxml|js|wxss)
- cloudfunctions/ensureUser (index.js + package.json)
- cloudfunctions/login/index.js
- cloudfunctions/getPhoneNumber/index.js

部署：
1) 解压覆盖到项目根目录；
2) 开发者工具 → 右键部署 `ensureUser`、`login`、`getPhoneNumber`（选择“云端安装依赖”）；
3) 编译后到“我的”页测试 微信授权登录 与 手机号一键登录。

注意：`onWeChatLoginTap` 中 **先** `wx.getUserProfile`，拿到 userInfo 后 **再** `wx.login` + 云函数 + 落库，避免 “can only be invoked by user TAP gesture”。
