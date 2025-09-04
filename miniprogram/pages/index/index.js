Page({
  data: { phone: '' },

  openPrivacy() {
    wx.getPrivacySetting({
      success: (r) => {
        if (!r.needAuthorization) {
          wx.showToast({ title: '当前无需再次同意', icon: 'none' });
          return;
        }
        wx.requirePrivacyAuthorize({
          success: () => wx.showToast({ title: '已同意隐私' }),
          fail: (err) => {
            console.log('requirePrivacyAuthorize fail:', err);
            wx.showToast({ title: '需同意隐私后再操作', icon: 'none' });
          }
        });
      }
    });
  },

  async onLogin() {
    try {
      const { code } = await wx.login();
      if (!code) { wx.showToast({ title: '登录失败', icon: 'none' }); return; }
      const r = await wx.cloud.callFunction({ name: 'authLogin', data: { code } });
      const openid = r?.result?.openid || r?.result?.data?.openid;
      if (openid) { wx.setStorageSync('openid', openid); wx.showToast({ title: '登录成功' }); }
    } catch (err) {
      wx.showToast({ title: err.errMsg || '登录异常', icon: 'none' });
    }

  }
});
