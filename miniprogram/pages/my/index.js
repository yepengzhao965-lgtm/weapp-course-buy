// pages/my/index.js
Page({
  data:{ user:null, busy:false },

  onShow(){
    try{ const u = wx.getStorageSync('user') || null; if(u) this.setData({ user:u }) }catch(e){}
  },

  // 登录：点击手机号授权按钮
  async onPhoneLogin(e){
    console.log('getPhoneNumber detail:', e.detail)
    const phoneCode = e?.detail?.code
    if(!phoneCode){ wx.showToast({ title:'已取消或失败', icon:'none' }); return }
    this.setData({ busy:true })
    try{
      // 1) 静默获取 openid（不弹窗）
      try{
        const { code } = await wx.login()
        if(code){
          const r = await wx.cloud.callFunction({ name:'authLogin', data:{ code } })
          const openid = r?.result?.openid || r?.result?.data?.openid
          if(openid) wx.setStorageSync('openid', openid)
        }
      }catch(err){ console.warn('authLogin error', err) }

      // 2) 用手机号 code 调云函数换手机号并写库
      const r2 = await wx.cloud.callFunction({ name:'getPhoneNumber', data:{ code: phoneCode } })
      const user = r2?.result?.user
      if(user){ wx.setStorageSync('user', user); this.setData({ user }); wx.showToast({ title:'登录成功' }) }
      else { wx.showToast({ title:'登录失败', icon:'none' }) }
    }catch(err){
      console.error('onPhoneLogin error', err)
      wx.showToast({ title:'登录失败', icon:'none' })
    }finally{
      this.setData({ busy:false })
    }
  },

  // 已登录后补绑定手机号
  async onBindPhone(e){
    const code = e?.detail?.code
    if(!code){ wx.showToast({ title:'未获取到手机号', icon:'none' }); return }
    try{
      const r = await wx.cloud.callFunction({ name:'getPhoneNumber', data:{ code } })
      const user = r?.result?.user
      if(user){ wx.setStorageSync('user', user); this.setData({ user }); wx.showToast({ title:'手机号已绑定' }) }
      else { wx.showToast({ title:'绑定失败', icon:'none' }) }
    }catch(err){ console.error('bindPhone error', err); wx.showToast({ title:'绑定失败', icon:'none' }) }
  }
})
