
# Login Patch for weapp-course-buy

Date: 2025-08-19

This patch adds **WeChat authorized login and phone-number one-tap login** with
**real cloud function calls** and server-side persistence.

## Files

- miniprogram/pages/profile/profile.js
- miniprogram/pages/profile/profile.wxml
- miniprogram/pages/profile/profile.wxss
- cloudfunctions/ensureUser/index.js
- cloudfunctions/ensureUser/package.json
- cloudfunctions/login/index.js
- cloudfunctions/getPhoneNumber/index.js

## How to apply

1. Copy the folders in this zip to your project root, overwrite same paths.
2. In WeChat DevTools, right-click cloudfunctions/**ensureUser** -> Upload and Deploy.
   (login and getPhoneNumber already exist; redeploy if needed.)
3. Compile the mini-program. Go to "我的":
   - Click **微信授权登录** -> should show auth popup, then user doc appears in DB.
   - Click **手机号一键登录** -> decrypts phone via cloud function, then persists.

No third-party libs added.
