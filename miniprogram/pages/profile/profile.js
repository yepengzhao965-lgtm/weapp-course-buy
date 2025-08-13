const app = getApp()

Page({
  data: {
    user: null,
    openid: '',
    editMode: false
  },

  async onLoad() {
    try {
      const openid = await app.ensureOpenid()
      this.setData({ openid })
      const db = wx.cloud.database()
      const got = await db.collection('users').doc(openid).get().catch(() => null)
      if (got && got.data) this.setData({ user: got.data })
    } catch (e) {
      console.error(e)
      wx.showToast({ title: '登录初始化失败', icon: 'none' })
    }
  },

  // 微信授权：拿头像昵称并写入 users（docId = openid）
  onGetUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: async (res) => {
        const { nickName, avatarUrl } = res.userInfo || {}
        const db = wx.cloud.database()
        await db.collection('users').doc(this.data.openid).set({
          data: { nickName, avatarUrl, createdAt: new Date() }
        }).catch(async () => {
          await db.collection('users').doc(this.data.openid).update({ data: { nickName, avatarUrl } })
        })
        this.setData({ user: { nickName, avatarUrl } })
        wx.showToast({ title: '登录成功' })
      },
      fail: () => wx.showToast({ title: '已取消授权', icon: 'none' })
    })
  },

  // 重新授权：删除当前资料 -> 触发一次授权
  async reAuth() {
    try {
      const db = wx.cloud.database()
      await db.collection('users').doc(this.data.openid).remove().catch(()=>{})
      this.setData({ user: null, editMode: false })
      this.onGetUserProfile()
    } catch (e) {
      console.error(e)
      wx.showToast({ title: '重试失败', icon: 'none' })
    }
  },

  // 编辑资料（不依赖微信昵称）
  toggleEdit() { this.setData({ editMode: !this.data.editMode }) },
  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl
    this.setData({ user: { ...(this.data.user || {}), avatarUrl } })
  },
  onNickInput(e) {
    const nickName = e.detail.value
    this.setData({ user: { ...(this.data.user || {}), nickName } })
  },
  async saveProfile() {
    try {
      const db = wx.cloud.database()
      await db.collection('users').doc(this.data.openid).set({
        data: { ...(this.data.user || {}), updatedAt: new Date() }
      }).catch(async () => {
        await db.collection('users').doc(this.data.openid).update({ data: this.data.user })
      })
      wx.showToast({ title: '已保存' })
      this.setData({ editMode: false })
    } catch (e) {
      console.error(e)
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  goMyCourses() { wx.navigateTo({ url: '/pages/my-courses/my-courses' }) }
})
