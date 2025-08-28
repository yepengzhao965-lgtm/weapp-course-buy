// pages/_debug/phone-login/index.js
Page({
  data:{ log:'' },
  print(x){ this.setData({ log: (this.data.log + '\n' + (typeof x==='string'?x:JSON.stringify(x))) }) },
  handle(e){
    this.print({ step:'getPhoneNumber', detail: e.detail })
    const code = e?.detail?.code
    if(!code){ wx.showToast({ title:'已取消/失败', icon:'none' }); return }
  }
})
