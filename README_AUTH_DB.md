
# 微信授权登录 + 数据库存储（完整补丁）

包含：
- 云函数：authLogin（code2session）、ensureUser（写 users 库）、getPhoneNumber（绑定手机号）、whoami（调试）
- 页面：pages/my/index.*（登录按钮 + 绑定手机号按钮）

## 部署步骤（一次过）
1) 在云开发里 **新建/上传** 这 4 个云函数，并为 **authLogin** 配环境变量：
   - APPID：你的小程序 AppID
   - APP_SECRET：你的小程序 AppSecret
   配完点“创建新版本”（不发布不生效）；超时建议 10 秒。

2) 数据库：
   - 打开**云开发 → 数据库**，新建集合 **users**（也可无需手建，首次写入会自动创建）；
   - 在集合 **规则** 里选择 **仅创建者可读写（推荐）**。

3) 页面：确保 `app.json` 里有 `"pages/my/index"`（tab栏“我的”页）；
   开发者工具 **清缓存并编译**。

4) 真机测试：
   - 打开“我的”页 → 点“微信一键授权登录”；
   - 成功后会：本地存 `openid` 与 `user`，数据库 **users** 集合新增/更新你的 doc（docId = OPENID）；
   - 可继续点“绑定手机号”，会在 users 里写入 `mobile`。

## users 文档结构（示例）
{
  "_id": "<OPENID>",
  "_openid": "<OPENID>",
  "role": "buyer",
  "nickName": "张三",
  "avatarUrl": "https://.../132",
  "gender": 1,
  "country": "China",
  "province": "Beijing",
  "city": "Beijing",
  "mobile": "138****0000",
  "mobileVerified": true,
  "createdAt": "2025-08-22T00:00:00.000Z",
  "updatedAt": "2025-08-22T00:00:00.000Z"
}

## 常见问题
- 按钮点了不弹授权：必须由 **bindtap** 触发；我已把授权放在第一步，并与登录并行；请在真机测试；
- 拿到 openid 但前端说失败：本补丁已兼容两种返回（纯 {openid} 或带 ok:true 的格式）；
- getPhoneNumber 报错：需要真机，且小程序类目允许；云函数默认支持 `cloud.openapi.phonenumber.getPhoneNumber`。
