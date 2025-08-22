Page({
  data:{ list:[], user:null, busy:false },

  onShow(){
    try{ const u = wx.getStorageSync('user') || null; this.setData({ user:u }) }catch(e){}
    this.fetch && this.fetch()
  },

  async fetch(){
    if(this.data.busy) return
    this.setData({ busy:true })
    try{
      const r = await wx.cloud.callFunction({ name:'orders', data:{ action:'mine' } })
      let list = (r && r.result && r.result.list) ? r.result.list : []
      list = list.map(x => { x.priceYuan = (Number(x.amount||0)/100).toFixed(2); return x })
      this.setData({ list })
    }catch(e){
      console.error(e)
    }finally{
      this.setData({ busy:false })
    }
  },

  async loginTap(){
    if(this.data.busy) return
    this.setData({ busy:true })
    try{
      const gp = await wx.getUserProfile({ desc: '用于完善个人资料' })
      const profile = gp && gp.userInfo ? gp.userInfo : {}
      await wx.login()
      try{ await wx.cloud.callFunction({ name:'login' }) }catch(e){}
      const r = await wx.cloud.callFunction({ name:'ensureUser', data:{ profile } })
      const user = r && r.result && r.result.user ? r.result.user : null
      if(user){
        wx.setStorageSync('user', user)
        this.setData({ user })
        wx.showToast({ title:'已登录' })
        this.fetch && this.fetch()
      }else{
        wx.showToast({ title:'登录失败', icon:'none' })
      }
    }catch(e){
      console.error('loginTap error', e)
      wx.showToast({ title:'用户取消或失败', icon:'none' })
    }finally{
      this.setData({ busy:false })
    }
  }
})
