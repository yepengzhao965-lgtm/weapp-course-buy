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

  async onGetPhoneNumber(e) {
    console.log('getPhoneNumber detail:', e.detail);
    const { errMsg, code, encryptedData, iv } = e.detail || {};

    if (errMsg !== 'getPhoneNumber:ok') {
      wx.showToast({ title: '未授权或被拦截', icon: 'none' });
      return;
    }

    // 新方案：一次性 code
    if (code) {
      wx.request({
        url: 'https://YOUR_API_DOMAIN/wechat/phone',
        method: 'POST',
        header: { 'content-type': 'application/json' },
        data: { code },
        success: ({ data }) => this._handleResp(data),
        fail: (err) => this._reqFail(err)
      });
      return;
    }

    // 兼容旧方案：encryptedData + iv
    if (encryptedData && iv) {
      wx.login({
        success: ({ code: loginCode }) => {
          wx.request({
            url: 'https://YOUR_API_DOMAIN/wechat/phone-legacy',
            method: 'POST',
            header: { 'content-type': 'application/json' },
            data: { loginCode, encryptedData, iv },
            success: ({ data }) => this._handleResp(data),
            fail: (err) => this._reqFail(err)
          });
        },
        fail: () => wx.showToast({ title: 'wx.login 失败', icon: 'none' })
      });
      return;
    }

    wx.showToast({ title: '未获取到 code/加密数据', icon: 'none' });
  },

  _handleResp(data) {
    if (data && data.phoneNumber) {
      this.setData({ phone: data.phoneNumber });
      wx.showToast({ title: '获取成功' });
    } else {
      wx.showToast({ title: '后端未返回手机号', icon: 'none' });
      console.log('server resp:', data);
    }
  },

  _reqFail(err) {
    wx.showToast({ title: '请求失败', icon: 'none' });
    console.error('request error:', err);
  }
});
