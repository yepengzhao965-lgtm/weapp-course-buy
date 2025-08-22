
# REAL 微信授权登录补丁（code2Session）

包含：
- cloudfunctions/authLogin：后端 `jscode2session`，返回 openid/session_key。需在云函数环境变量配置：APPID、APP_SECRET。
- miniprogram/pages/profile：前端按钮点击 → `wx.login` → `authLogin` → `wx.getUserProfile` → `ensureUser`。

使用：把本补丁覆盖到项目根目录；部署云函数 authLogin；在其环境变量填入 APPID / APP_SECRET；在 “资料/登录” 页面点击“微信一键授权登录”。
