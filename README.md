# 微信小程序获取手机号 - 最小可跑示例

## 目录
- miniprogram/ 小程序端
- server/      Node.js 后端

## 使用步骤
1. 后端：
   ```bash
   cd server
   cp .env.example .env   # 填写 WECHAT_APPID / WECHAT_SECRET
   npm i
   npm start
   ```
2. 小程序：将 `miniprogram/` 用微信开发者工具打开为小程序项目。
   - appid 使用你自己的
   - 小程序后台：把后端域名加到「request 合法域名」
   - 开发管理：填写并发布《用户隐私保护指引》
   - 把测试微信号加入开发者/体验者
3. 真机点击页面按钮测试。

## 重要说明
- 前端拿到的是一次性 `code`，必须发给后端再从微信换手机号。
- 需要真机测试，工具里大多不会返回真实手机号。
