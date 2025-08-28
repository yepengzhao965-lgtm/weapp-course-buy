// pages/my/index.js
Page({
  data:{ user:null, busy:false },

  onShow(){
    try{ const u = wx.getStorageSync('user') || null; if(u) this.setData({ user:u }) }catch(e){}
  },

  async onQuickPhone(e){
    const msg = e?.detail?.errMsg || '';
    console.log('getPhoneNumber detail:', e.detail);

    // 隐私未同意 -> 打开隐私协议，引导再点一次
    if (msg.includes('no permission')){
      try{ getApp().openPrivacy() }catch(err){}
      wx.showToast({ title:'请先同意隐私协议后再点击登录', icon:'none' });
      return;
    }

    const code = e?.detail?.code;
    if (!code){ wx.showToast({ title:'已取消或失败', icon:'none' }); return; }

    this.setData({ busy:true });
    try{
      // 用 code 调云函数换手机号并写库
      const r = await wx.cloud.callFunction({ name:'getPhoneNumber', data:{ code } });
      const user = r?.result?.user;
      if(user){
        wx.setStorageSync('user', user);
        this.setData({ user });
        wx.showToast({ title:'登录成功' });
      }else{
        wx.showToast({ title:'登录失败', icon:'none' });
      }
    }catch(err){
      console.error('quick get phone error', err);
      wx.showToast({ title:'登录失败', icon:'none' });
    }finally{
      this.setData({ busy:false });
    }
  }
})
