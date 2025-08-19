# Hotfix: Verified Cloud Login + Diagnostics
Date: 2025-08-19

What’s inside:
- Robust `miniprogram/app.js` init + `ensureOpenid`
- `pages/profile/*` with explicit cloud function calls (login / ensureUser / getPhoneNumber)
- Cloud functions:
  - `cloudfunctions/ensureUser` (server-side persistence with logs)
  - `cloudfunctions/login` (returns OPENID with logs)
  - `cloudfunctions/getPhoneNumber` (phone decrypt with logs)
- Diagnostics page `pages/_diag_auth`

How to apply:
1. Copy these files into your project, merge paths.
2. In DevTools: Deploy `cloudfunctions/ensureUser`, `login`, `getPhoneNumber`.
3. Add `"pages/_diag_auth/index"` to `miniprogram/app.json` pages array (prefer放末尾，非tab页)。
4. Recompile -> 打开 `_diag_auth` 页面，点击两个按钮：
   - `测试 login 云函数` 出现 openid。
   - `写库 ensureUser` 返回 OK，DB 的 users 集合出现/更新 openid 文档。
5. 再到“我的”页测试两条登录链路。

Troubleshooting:
- 若 getPhoneNumber 报错，真机测试优先；确保云开发已绑定到同一个小程序环境；确保已开通“云调用”。
- 若 users 集合写入失败，看云函数日志（有 console.log）。
