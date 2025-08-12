Page({
  data: {
    userInfo: null
  },
  onLoad() {
    this.getUserInfo();
  },
  getUserInfo() {
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: resp => {
              this.setData({ userInfo: resp.userInfo });
            },
          });
        }
      },
    });
  },
  onGetUserProfile() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: res => {
        this.setData({ userInfo: res.userInfo });
      },
    });
  }
});