// pages/login/index.js
Page({
  data:{ log:'' },

  print(x){ this.setData({ log: (this.data.log + '\n' + (typeof x==='string'?x:JSON.stringify(x))) }) },

  // A) 手机号授权登录：按钮弹系统窗 -> e.detail.code -> 云函数拿手机号
  async onPhoneLogin(e){
    const codePhone = e?.detail?.code
    this.print({ step:'getPhoneNumber', detail: e?.detail })
    if(!codePhone){ wx.showToast({ title:'已取消或失败', icon:'none' }); return }

    // 静默拿 openid（不弹窗）：wx.login -> authLogin
    try{
      const { code } = await wx.login()
      if(code){
        const r = await wx.cloud.callFunction({ name:'authLogin', data:{ code } })
        const openid = r?.result?.openid || r?.result?.data?.openid
        if(openid){ wx.setStorageSync('openid', openid); this.print({ step:'authLogin', openid }) }
      }
    }catch(err){ this.print({ step:'authLogin error', err: err?.errMsg || err?.message || String(err) }) }

    // 用手机号 code 调云函数换真实手机号并写库
    try{
      const r2 = await wx.cloud.callFunction({ name:'getPhoneNumber', data:{ code: codePhone } })
      this.print({ step:'getPhoneNumber cloud', result: r2?.result })
      if(r2?.result?.user){
        wx.setStorageSync('user', r2.result.user)
        wx.showToast({ title:'登录成功' })
      }else{
        wx.showToast({ title:'登录失败', icon:'none' })
      }
    }catch(err){ this.print({ step:'getPhoneNumber cloud error', err: err?.errMsg || err?.message || String(err) }) }
  },

  // B) 获取 UnionID：拿 encryptedData + iv -> 云函数解密
  async onGetUserInfo(e){
    const d = e?.detail || {}
    this.print({ step:'getUserInfo', detail: d && { errMsg:d.errMsg, hasEncrypted: !!d.encryptedData } })
    if(d.errMsg !== 'getUserInfo:ok' || !d.encryptedData || !d.iv){
      wx.showToast({ title:'取消或无数据', icon:'none' }); return
    }
    try{
      const { code } = await wx.login()
      if(!code){ wx.showToast({ title:'wx.login 失败', icon:'none' }); return }
      const r = await wx.cloud.callFunction({
        name:'getUnionIdDecrypt',
        data:{ code, encryptedData: d.encryptedData, iv: d.iv }
      })
      this.print({ step:'unionid decrypt', result: r?.result })
      if(r?.result?.unionId){
        const user = wx.getStorageSync('user') || {}
        user.unionId = r.result.unionId
        wx.setStorageSync('user', user)
        wx.showToast({ title:'已获取 UnionID' })
      }
    }catch(err){ this.print({ step:'unionid decrypt error', err: err?.errMsg || err?.message || String(err) }) }
  },
 // C) 用户信息授权登录：弹出头像昵称授权窗
 async onProfileLogin(){
  try{
    const profile = await wx.getUserProfile({ desc:'用于完善会员资料' })
    this.print({ step:'getUserProfile', userInfo: profile?.userInfo })
    const { code } = await wx.login()
    if(code){
      const r = await wx.cloud.callFunction({ name:'authLogin', data:{ code } })
      const openid = r?.result?.openid || r?.result?.data?.openid
      if(openid){ wx.setStorageSync('openid', openid); this.print({ step:'authLogin', openid }) }
    }
    wx.setStorageSync('user', profile?.userInfo || {})
    wx.showToast({ title:'登录成功' })
  }catch(err){
    this.print({ step:'getUserProfile error', err: err?.errMsg || err?.message || String(err) })
    wx.showToast({ title:'已取消或失败', icon:'none' })
  }
},

  onCheck(){
    this.print({ openid: wx.getStorageSync('openid') || '', user: wx.getStorageSync('user') || null })
  }
})
