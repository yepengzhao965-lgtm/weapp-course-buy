Page({
  data:{ user:null, busy:false },
  onShow(){ try{ const u = wx.getStorageSync('user') || null; if(u) this.setData({ user:u }) }catch(e){} },
  async onWeChatLoginTap(){
    if(this.data.busy) return; this.setData({ busy:true })
    try{
      const gp = await wx.getUserProfile({ desc: '用于完善个人资料' })
      const profile = gp && gp.userInfo ? gp.userInfo : {}
      const r = await wx.cloud.callFunction({ name: 'ensureUser', data: { profile } })
      const user = r && r.result && r.result.user ? r.result.user : null
      if(user){
        wx.setStorageSync('user', user)
        wx.showToast({ title:'登录成功' })
        setTimeout(()=>{ wx.navigateTo({ url:'/pages/my/index' }) }, 300)
      }else{
        wx.showToast({ title:'登录失败', icon:'none' })
      }
    }catch(e){
      console.error('onWeChatLoginTap error', e)
      wx.showToast({ title:'用户取消或失败', icon:'none' })
    }finally{
      this.setData({ busy:false })
    }
  }
})
