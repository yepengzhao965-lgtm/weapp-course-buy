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
      // 优先用全局/本地缓存，减少无谓调用
      const cached = wx.getStorageSync('openid');
      if (cached) {
        this.setData({ openid: cached });
        await this.refreshUserByOpenid(cached);
      }
    } catch (e) {
      console.error(e);
      wx.showToast({ title: '初始化失败', icon: 'none' });
    }
  },

  // —— 微信授权登录（严格按官方链路：wx.login -> 云函数login -> getUserProfile -> 云函数ensureUser）——
  async onWeChatLogin() {
    try {
      wx.showLoading({ title: '登录中…' });

      // 1) wx.login（拿 code）
      const loginRes = await new Promise((resolve, reject) =>
        wx.login({ timeout: 15000, success: resolve, fail: reject })
      );
      const code = loginRes?.code;
      if (!code) {
        wx.showToast({ title: 'code 获取失败', icon: 'none' });
        return;
      }

      // 2) 云函数 login（服务端拿 OPENID）
      const r = await wx.cloud.callFunction({ name: 'login', data: { code } });
      const openid = r?.result?.openid;
      const unionid = r?.result?.unionid || '';
      if (!openid) {
        wx.showToast({ title: '服务端登录失败', icon: 'none' });
        return;
      }
      app.globalData.openid = openid;
      wx.setStorageSync('openid', openid);
      this.setData({ openid });

      // 3) 获取头像昵称（需要用户点击确认）
      const prof = await new Promise((resolve, reject) =>
        wx.getUserProfile({ desc: '用于完善用户资料', success: resolve, fail: reject })
      );
      const { nickName, avatarUrl } = (prof && prof.userInfo) ? prof.userInfo : {};

      // 4) 写库放到云端：ensureUser
      const eu = await wx.cloud.callFunction({
        name: 'ensureUser',
        data: { nickName, avatarUrl }
      });
      if (!(eu && eu.result && eu.result.ok)) {
        wx.showToast({ title: '写库失败', icon: 'none' });
        return;
      }

      // 5) 刷新 UI
      await this.refreshUserByOpenid(openid);
      wx.showToast({ title: '登录成功' });
    } catch (e) {
      console.error(e);
      wx.showToast({ title: '已取消或失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 手机号一键登录
  async onGetPhoneNumber(e) {
    const code = e?.detail?.code;
    if (!code) {
      wx.showToast({ title: '已取消授权', icon: 'none' });
      return;
    }
    try {
      // 1) 通过云函数解密手机号
      const r = await wx.cloud.callFunction({ name: 'getPhoneNumber', data: { code } });
      const phoneNumber = r?.result?.phoneNumber;
      if (!phoneNumber) {
        wx.showToast({ title: '获取手机号失败', icon: 'none' });
        return;
      }
      // 2) 确保拿到 openid
      const lr = await wx.cloud.callFunction({ name: 'login' });
      const openid = lr?.result?.openid;
      if (!openid) {
        wx.showToast({ title: '服务端失败', icon: 'none' });
        return;
      }
      app.globalData.openid = openid;
      wx.setStorageSync('openid', openid);
      this.setData({ openid });

      // 3) 写库放到云端：ensureUser
      const eu = await wx.cloud.callFunction({
        name: 'ensureUser',
        data: { phoneNumber }
      });
      if (!(eu && eu.result && eu.result.ok)) {
        wx.showToast({ title: '写库失败', icon: 'none' });
        return;
      }

      await this.refreshUserByOpenid(openid);
      wx.showToast({ title: '登录成功' });
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '登录失败', icon: 'none' });
    }
  },

  // —— 辅助：读取 users 集合刷新状态 ——
  async refreshUserByOpenid(openid) {
    try {
      const db = wx.cloud.database();
      const got = await db.collection('users').doc(openid).get().catch(() => null);
      const user = got?.data || null;
      const isAdmin = user?.role === 'admin';
      this.setData({ user, isAdmin });
      app.globalData.isAdmin = isAdmin;
    } catch (e) {
      console.error(e);
    }
  },

  // 其余：编辑资料/重新授权（保持跟原始项目一致）
  toggleEdit() { this.setData({ editMode: !this.data.editMode }) },
  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl;
    this.setData({ user: { ...(this.data.user || {}), avatarUrl } });
  },
  onNickInput(e) {
    const nickName = e.detail.value;
    this.setData({ user: { ...(this.data.user || {}), nickName } });
  },
  async saveProfile() {
    try {
      // 将编辑动作也交给云端（可复用 ensureUser）
      const { nickName, avatarUrl } = this.data.user || {};
      const eu = await wx.cloud.callFunction({ name: 'ensureUser', data: { nickName, avatarUrl } });
      if (!(eu && eu.result && eu.result.ok)) throw new Error('ensureUser failed');
      await this.refreshUserByOpenid(this.data.openid);
      wx.showToast({ title: '已保存' });
      this.setData({ editMode: false });
    } catch (e) {
      console.error(e);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },
  goMyCourses() { wx.navigateTo({ url: '/pages/my-courses/my-courses' }) },
  goAddCourse() { wx.navigateTo({ url: '/pages/add-course/add-course' }) }
});