
Page({
  data:{ user:null, busy:false },
  onShow(){ try{ const u = wx.getStorageSync('user') || null; if(u) this.setData({ user:u }) }catch(e){} },
  async onAuthLoginTap(){
    if(this.data.busy) return; this.setData({ busy:true })
    try{
      const { code } = await wx.login()
      if(!code){ wx.showToast({ title:'登录失败: 无code', icon:'none' }); return }
      const r = await wx.cloud.callFunction({ name:'authLogin', data:{ code } })
      const auth = r && r.result || {}
      if(!auth.openid){ wx.showToast({ title:'登录失败', icon:'none' }); return }
      wx.setStorageSync('openid', auth.openid)
      const gp = await wx.getUserProfile({ desc: '用于完善个人资料' })
      const profile = gp && gp.userInfo ? gp.userInfo : {}
      const eu = await wx.cloud.callFunction({ name:'ensureUser', data:{ profile } })
      const user = eu && eu.result && eu.result.user ? eu.result.user : null
      if(user){ wx.setStorageSync('user', user); this.setData({ user }); wx.showToast({ title:'已授权' }) }
      else{ wx.showToast({ title:'授权失败', icon:'none' }) }
    }catch(e){
      console.error('onAuthLoginTap', e); wx.showToast({ title:'用户取消或失败', icon:'none' })
    }finally{ this.setData({ busy:false }) }
  }
})
