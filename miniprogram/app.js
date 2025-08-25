// app.js
let ENV_ID = '';
try { const env = require('./env.js'); ENV_ID = env.ENV_ID || '' } catch(e){}

App({
  globalData: { openid: '' },
  onLaunch(){
    if (!wx.cloud) { console.error('基础库过低'); return }
    wx.cloud.init({ env: ENV_ID || wx.cloud.DYNAMIC_CURRENT_ENV, traceUser: true })

    // 隐私协议拦截：避免 getPhoneNumber 被拦截为 no permission
    wx.getPrivacySetting({
      success(res){
        if (res.needAuthorization) {
          wx.requirePrivacyAuthorize({
            success(){ console.log('privacy ok') },
            fail(){ console.warn('privacy rejected') }
          })
        }
      }
    })
  }
})
