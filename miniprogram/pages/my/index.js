// pages/my/index.js
Page({
  data:{ user:null, busy:false },

  onShow(){
    try{ const u = wx.getStorageSync('user') || null; if(u) this.setData({ user:u }) }catch(e){}
  },

  // 用手机号弹窗完成验证+登录
  async onPhoneLogin(e){
    if(this.data.busy) return
    this.setData({ busy:true })
    try{
      const phoneCode = e && e.detail && e.detail.code
      if(!phoneCode){ wx.showToast({ title:'已取消', icon:'none' }); return }

      // 静默拿 openid
      const { code } = await wx.login()
      if(code){
        const { result } = await wx.cloud.callFunction({ name:'authLogin', data:{ code } })
        const openid = result && (result.openid || (result.data && result.data.openid))
        if(openid) wx.setStorageSync('openid', openid)
      }

      // 云函数取手机号并写库
      const r = await wx.cloud.callFunction({ name:'getPhoneNumber', data:{ code: phoneCode } })
      const user = r && r.result && r.result.user
      if(user){
        wx.setStorageSync('user', user)
        this.setData({ user })
        wx.showToast({ title:'登录成功' })
      }else{
        wx.showToast({ title:'登录失败', icon:'none' })
      }
    }catch(err){
      console.error('onPhoneLogin', err)
      wx.showToast({ title:'登录失败', icon:'none' })
    }finally{
      this.setData({ busy:false })
    }
  },

  // 老路径保留：授权资料后写库
  async onAuthLoginTap(){
    if(this.data.busy) return
    this.setData({ busy:true })
    try{
      const profileP = wx.getUserProfile({ desc: '用于完善个人资料' })
      const loginP = (async ()=>{
        const { code } = await wx.login()
        if(!code) return {}
        const { result } = await wx.cloud.callFunction({ name:'authLogin', data:{ code } })
        const openid = result && (result.openid || (result.data && result.data.openid))
        return { openid }
      })()
      const [gp, auth] = await Promise.all([profileP, loginP])
      const openid = auth && auth.openid
      if(!openid){ wx.showToast({ title:'authLogin 失败', icon:'none' }); return }

      wx.setStorageSync('openid', openid)
      const profile = gp && gp.userInfo ? gp.userInfo : {}
      const eu = await wx.cloud.callFunction({ name:'ensureUser', data:{ profile } })
      const user = eu && eu.result && eu.result.user ? eu.result.user : null
      if(user){ wx.setStorageSync('user', user); this.setData({ user }); wx.showToast({ title:'已授权' }) }
      else { wx.showToast({ title:'授权失败', icon:'none' }) }
    }catch(e){
      wx.showToast({ title:'取消或失败', icon:'none' })
    }finally{
      this.setData({ busy:false })
    }
  },

  // 仅绑定手机号（已登录后补绑定）
  async onGetPhoneNumber(e){
    const code = (e && e.detail && e.detail.code) || ''
    if(!code){ wx.showToast({ title:'未获取到手机号', icon:'none' }); return }
    try{
      const r = await wx.cloud.callFunction({ name:'getPhoneNumber', data:{ code } })
      const user = r && r.result && r.result.user
      if(user){ wx.setStorageSync('user', user); this.setData({ user }); wx.showToast({ title:'手机号已绑定' }) }
      else { wx.showToast({ title:'绑定失败', icon:'none' }) }
    }catch(err){ console.error('getPhoneNumber', err); wx.showToast({ title:'绑定失败', icon:'none' }) }
  },

  onGoProfileTap(){ wx.navigateTo({ url:'/pages/profile/index' }) }
})
