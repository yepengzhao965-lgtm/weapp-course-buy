App({
  globalData: { openid: '', version: '0.2.0', mockPay: true, isAdmin: false },

  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3+ 基础库');
      return;
    }
    // 绑定到项目当前环境，无需手动写 envId
    wx.cloud.init({ env: wx.cloud.DYNAMIC_CURRENT_ENV, traceUser: true });

    // 可选：从本地恢复 openid，减少云函数调用
    const cached = wx.getStorageSync('openid');
    if (cached) {
      this.globalData.openid = cached;
    } else {
      // 无缓存时调用云函数获取 openid
      this.ensureOpenid();
    }
  },

  // 全局确保拿到 openid，并缓存
  async ensureOpenid() {
    if (this.globalData.openid) return this.globalData.openid;
    const r = await wx.cloud.callFunction({ name: 'login' });
    const openid = r?.result?.openid || '';
    this.globalData.openid = openid;
    if (openid) wx.setStorageSync('openid', openid);
    return openid;
  }
});

