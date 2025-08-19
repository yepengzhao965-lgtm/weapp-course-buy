App({
  globalData: { openid: '', isAdmin: false },
  onLaunch() {
    if (!wx.cloud) { console.error('基础库过低'); return; }
    wx.cloud.init({ env: wx.cloud.DYNAMIC_CURRENT_ENV, traceUser: true });
    const cached = wx.getStorageSync('openid');
    if (cached) this.globalData.openid = cached;
    this.ensureOpenid().catch(err => console.error('ensureOpenid failed', err));
  },
  async ensureOpenid() {
    if (this.globalData.openid) return this.globalData.openid;
    const r = await wx.cloud.callFunction({ name: 'login' });
    const openid = r?.result?.openid || '';
    if (openid) { this.globalData.openid = openid; wx.setStorageSync('openid', openid); }
    return openid;
  }
});
