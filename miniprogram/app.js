let ENV_ID = ''; let MOCK_PAY = true;
try { const env = require('./env.js'); ENV_ID = env.ENV_ID || ''; MOCK_PAY = !!env.MOCK_PAY } catch(e){}
App({
  globalData: { openid:'', MOCK_PAY },
  onLaunch(){
    if (!wx.cloud) { console.error('基础库过低'); return }
    wx.cloud.init({ env: ENV_ID || wx.cloud.DYNAMIC_CURRENT_ENV, traceUser: true })
    const cached = wx.getStorageSync('openid'); if (cached) this.globalData.openid = cached
    this.ensureOpenid().catch(err => console.error('ensureOpenid failed', err))
  },
  async ensureOpenid(){
    if (this.globalData.openid) return this.globalData.openid
    const r = await wx.cloud.callFunction({ name: 'login', config: ENV_ID? {env:ENV_ID}:{} })
    const openid = r && r.result && r.result.openid
    if (openid){ this.globalData.openid = openid; wx.setStorageSync('openid', openid) }
    return openid
  }
})
