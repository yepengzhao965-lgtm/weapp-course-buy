// app.js (按需隐私 + 快速验证)
let ENV_ID = ''; try { const env = require('./env.js'); ENV_ID = env.ENV_ID || '' } catch(e){}
App({
  onLaunch(){
    if (!wx.cloud) { console.error('基础库过低'); return }
    wx.cloud.init({ env: ENV_ID || wx.cloud.DYNAMIC_CURRENT_ENV, traceUser: true })
  },
  openPrivacy(){ try{ wx.openPrivacyContract() }catch(e){} }
})
