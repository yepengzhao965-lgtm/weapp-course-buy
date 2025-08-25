// pages/profile/index.js
Page({
  data:{ user:null, busy:false, diag:'' },
  onShow(){
    try{ const u = wx.getStorageSync('user') || null; if(u) this.setData({ user:u }) }catch(e){}
  },
  log(msg){ console.log('[profile]', msg); this.setData({ diag: (this.data.diag + '\n' + (typeof msg==='string'?msg:JSON.stringify(msg))) }) },
  async onAuthLoginTap(){
    if(this.data.busy) return
    this.setData({ busy:true, diag:'' })
    try{
      // ① wx.login
      const loginRes = await wx.login()
      this.log({ step:'wx.login', loginRes })
      if(!loginRes.code){ wx.showToast({ title:'无code', icon:'none' }); return }

      // ② authLogin
      const cf = await wx.cloud.callFunction({ name:'authLogin', data:{ code: loginRes.code } })
      const auth = cf && cf.result || {}
      this.log({ step:'authLogin', auth })
      if(!auth.ok){ wx.showModal({ title:'authLogin失败', content: JSON.stringify(auth).slice(0,900), showCancel:false }); return }
      wx.setStorageSync('openid', auth.openid)

      // ③ getUserProfile（必须点击触发）
      const gp = await wx.getUserProfile({ desc: '用于完善个人资料' })
      const profile = gp && gp.userInfo ? gp.userInfo : {}
      this.log({ step:'getUserProfile', profile })

      // ④ ensureUser
      const eu = await wx.cloud.callFunction({ name:'ensureUser', data:{ profile } })
      const user = eu && eu.result && eu.result.user ? eu.result.user : null
      this.log({ step:'ensureUser', user })
      if(user){
        wx.setStorageSync('user', user)
        this.setData({ user })
        wx.showToast({ title:'已授权' })
      }else{
        wx.showToast({ title:'ensureUser失败', icon:'none' })
      }
    }catch(e){
      console.error('onAuthLoginTap', e)
      wx.showModal({ title:'登录出错', content: (e.errMsg || e.message || String(e)).slice(0,900), showCancel:false })
    }finally{
      this.setData({ busy:false })
    }
  },
  async onCheckTap(){
    this.setData({ diag:'' })
    try{
      const who = await wx.cloud.callFunction({ name:'whoami' })
      this.log({ step:'whoami', ctx: who && who.result })
      const openid = wx.getStorageSync('openid') || ''
      const user = wx.getStorageSync('user') || null
      this.log({ step:'storage', openid, hasUser: !!user })
      wx.showToast({ title:'检查完成' })
    }catch(e){
      this.log({ step:'check error', msg: e && (e.errMsg||e.message||String(e)) })
    }
  },
  onLogoutTap(){
    wx.removeStorageSync('openid')
    wx.removeStorageSync('user')
    this.setData({ user:null })
    wx.showToast({ title:'已退出' })
  }
})
