const app = getApp();

Page({
  data: {
    user: null,
    openid: '',
    editMode: false,
    isAdmin: false,
  },

  async onLoad() {
    try {
      const cached = wx.getStorageSync('openid');
      if (cached) {
        this.setData({ openid: cached });
        await this.refreshUserByOpenid(cached);
      } else {
        const r = await wx.cloud.callFunction({ name: 'login' });
        const openid = r?.result?.openid;
        if (openid) { wx.setStorageSync('openid', openid); this.setData({ openid }); await this.refreshUserByOpenid(openid); }
      }
    } catch (e) { console.error(e); wx.showToast({ title: '初始化失败', icon: 'none' }); }
  },

  // 关键修复：tap 回调里先 getUserProfile，再做任何 await
  onWeChatLoginTap() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: async ({ userInfo }) => {
        wx.showLoading({ title: '登录中…' });
        try {
          const { code } = await new Promise((resolve, reject) => wx.login({ timeout: 15000, success: resolve, fail: reject }));
          const lr = await wx.cloud.callFunction({ name: 'login', data: { code } });
          const openid = lr?.result?.openid;
          if (!openid) { wx.showToast({ title: '服务端失败', icon: 'none' }); return; }
          wx.setStorageSync('openid', openid);
          app.globalData.openid = openid;
          this.setData({ openid });

          const { nickName, avatarUrl } = userInfo || {};
          const eu = await wx.cloud.callFunction({ name: 'ensureUser', data: { nickName, avatarUrl } });
          if (!(eu && eu.result && eu.result.ok)) { wx.showToast({ title: '写库失败', icon: 'none' }); return; }

          await this.refreshUserByOpenid(openid);
          wx.showToast({ title: '登录成功' });
        } catch (e) {
          console.error('onWeChatLoginTap error', e);
          wx.showToast({ title: '失败', icon: 'none' });
        } finally {
          wx.hideLoading();
        }
      },
      fail: () => wx.showToast({ title: '已取消授权', icon: 'none' })
    });
  },

  async onGetPhoneNumber(e) {
    const code = e?.detail?.code;
    if (!code) { wx.showToast({ title: '已取消授权', icon: 'none' }); return; }
    try {
      const r = await wx.cloud.callFunction({ name: 'getPhoneNumber', data: { code } });
      const phoneNumber = r?.result?.phoneNumber;
      if (!phoneNumber) { wx.showToast({ title: '获取手机号失败', icon: 'none' }); return; }

      const lr = await wx.cloud.callFunction({ name: 'login' });
      const openid = lr?.result?.openid;
      if (!openid) { wx.showToast({ title: '服务端失败', icon: 'none' }); return; }
      wx.setStorageSync('openid', openid);
      app.globalData.openid = openid;
      this.setData({ openid });

      const eu = await wx.cloud.callFunction({ name: 'ensureUser', data: { phoneNumber } });
      if (!(eu && eu.result && eu.result.ok)) { wx.showToast({ title: '写库失败', icon: 'none' }); return; }

      await this.refreshUserByOpenid(openid);
      wx.showToast({ title: '登录成功' });
    } catch (err) {
      console.error('onGetPhoneNumber error', err);
      wx.showToast({ title: '登录失败', icon: 'none' });
    }
  },

  async refreshUserByOpenid(openid) {
    try {
      const db = wx.cloud.database();
      const got = await db.collection('users').doc(openid).get().catch(() => null);
      const user = got?.data || null;
      const isAdmin = user?.role === 'admin';
      this.setData({ user, isAdmin });
      app.globalData.isAdmin = isAdmin;
    } catch (e) { console.error('refreshUser error', e); }
  },

  toggleEdit() { this.setData({ editMode: !this.data.editMode }) },
  onChooseAvatar(e) { const avatarUrl = e.detail.avatarUrl; this.setData({ user: { ...(this.data.user || {}), avatarUrl } }); },
  onNickInput(e) { const nickName = e.detail.value; this.setData({ user: { ...(this.data.user || {}), nickName } }); },
  async saveProfile() {
    try {
      const { nickName, avatarUrl } = this.data.user || {};
      const eu = await wx.cloud.callFunction({ name: 'ensureUser', data: { nickName, avatarUrl } });
      if (!(eu && eu.result && eu.result.ok)) throw new Error('ensureUser failed');
      await this.refreshUserByOpenid(this.data.openid);
      wx.showToast({ title: '已保存' });
      this.setData({ editMode: false });
    } catch (e) { console.error('saveProfile error', e); wx.showToast({ title: '保存失败', icon: 'none' }); }
  },
  goMyCourses() { wx.navigateTo({ url: '/pages/my-courses/my-courses' }) },
  goAddCourse() { wx.navigateTo({ url: '/pages/add-course/add-course' }) }
});
