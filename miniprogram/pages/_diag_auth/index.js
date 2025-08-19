Page({
  data:{ openid:'', ensureOk:false },
  async testLogin(){
    try{
      const r = await wx.cloud.callFunction({ name:'login' });
      this.setData({ openid: r?.result?.openid || '' });
      wx.showToast({ title:'login ok' });
    }catch(e){ console.error(e); wx.showToast({ title:'login fail', icon:'none' }); }
  },
  async testEnsure(){
    try{
      const r = await wx.cloud.callFunction({ name:'ensureUser', data:{ nickName:'诊断用户' } });
      this.setData({ ensureOk: !!(r && r.result && r.result.ok) });
      wx.showToast({ title:'ensure ok' });
    }catch(e){ console.error(e); wx.showToast({ title:'ensure fail', icon:'none' }); }
  }
})
