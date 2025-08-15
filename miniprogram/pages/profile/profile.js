const app = getApp()

Page({
  data: {
    user: null,
    openid: '',
    editMode: false,
    isAdmin: false
  },

  async onLoad() {
    try {
      const openid = await app.ensureOpenid()
      this.setData({ openid })
      const db = wx.cloud.database()
      const got = await db.collection('users').doc(openid).get().catch(() => null)
      if (got && got.data) {
        const isAdmin = got.data.role === 'admin'
        this.setData({ user: got.data, isAdmin })
        app.globalData.isAdmin = isAdmin
      }
    } catch (e) {
      console.error(e)
      wx.showToast({ title: '登录初始化失败', icon: 'none' })
    }
  },
 // 手机号授权：获取用户手机号并写入 users
 async onGetPhoneNumber(e) {
  const code = e?.detail?.code
  if (!code) {
    wx.showToast({ title: '已取消授权', icon: 'none' })
    return
  }
  try {
    const r = await wx.cloud.callFunction({ name: 'getPhoneNumber', data: { code } })
    const phoneNumber = r?.result?.phoneNumber
    if (!phoneNumber) {
      wx.showToast({ title: '获取手机号失败', icon: 'none' })
      return
    }
    const db = wx.cloud.database()
    await db.collection('users').doc(this.data.openid).set({
      data: { phoneNumber, createdAt: new Date() }
    }).catch(async () => {
      await db.collection('users').doc(this.data.openid).update({ data: { phoneNumber } })
    })
    this.setData({ user: { ...(this.data.user || {}), phoneNumber } })
    wx.showToast({ title: '登录成功' })
  } catch (err) {
    console.error(err)
    wx.showToast({ title: '登录失败', icon: 'none' })
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
          data: { nickName, avatarUrl, role: 'visitor', createdAt: new Date() }
        }).catch(async () => {
         
          await db.collection('users').doc(this.data.openid).update({ data: { nickName, avatarUrl } })
        })
       
        const got = await db.collection('users').doc(this.data.openid).get().catch(() => null)
        const user = got?.data || { nickName, avatarUrl }
        const isAdmin = user.role === 'admin'
        this.setData({ user, isAdmin })
        app.globalData.isAdmin = isAdmin
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
      this.setData({ user: null, editMode: false, isAdmin: false })
      app.globalData.isAdmin = false
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
      const { nickName, avatarUrl } = this.data.user || {}
      const data = { nickName, avatarUrl, updatedAt: new Date() }
      await db.collection('users').doc(this.data.openid).update({ data }).catch(async () => {
        await db.collection('users').doc(this.data.openid).set({ data: { ...data, role: 'visitor', createdAt: new Date() } })
      })
      const got = await db.collection('users').doc(this.data.openid).get().catch(() => null)
      const user = got?.data || { nickName, avatarUrl }
      const isAdmin = user.role === 'admin'
      app.globalData.isAdmin = isAdmin
      wx.showToast({ title: '已保存' })
      this.setData({ editMode: false, isAdmin, user })
    } catch (e) {
      console.error(e)
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  goMyCourses() { wx.navigateTo({ url: '/pages/my-courses/my-courses' }) },
  goAddCourse() { wx.navigateTo({ url: '/pages/add-course/add-course' }) }
})