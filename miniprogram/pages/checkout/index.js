import { callFunction } from '../../utils/cloud'
Page({
  data:{ id:'', course:null, _busy:false },
  onLoad(q){ this.setData({ id: (q && q.id) ? q.id : '' }); this.fetch() },
  async fetch(){
    try{
      const r = await callFunction('courses', { action:'get', id:this.data.id })
      const course = (r && r.result && r.result.course) ? r.result.course : null
      if (course) course.priceYuan = (course.price/100).toFixed(2)
      this.setData({ course: course })
    }catch(e){ console.error(e); wx.showToast({ title:'加载失败', icon:'none' }) }
  },
  async pay(){
    if(this.data._busy) return; this.setData({ _busy:true })
    try{
      const crt = await callFunction('orders', { action:'create', courseId:this.data.id })
      const order = (crt && crt.result && crt.result.order) ? crt.result.order : null
      if(!order){ wx.showToast({ title:'下单失败', icon:'none' }); return }
      const pre = await callFunction('prepay', { outTradeNo: order.outTradeNo })
      const pay = pre ? pre.result : null
      if(pay && pay.mockPaid){ wx.showToast({ title:'已支付(模拟)' }); setTimeout(function(){ wx.redirectTo({ url:'/pages/my/index' }) }, 600); return }
      await wx.requestPayment({ timeStamp: pay.timeStamp, nonceStr: pay.nonceStr, package: pay.package, signType: 'RSA', paySign: pay.paySign })
      await callFunction('orders', { action:'query', outTradeNo: order.outTradeNo })
      wx.showToast({ title:'支付成功' }); setTimeout(function(){ wx.redirectTo({ url:'/pages/my/index' }) }, 600)
    }catch(e){ console.error('pay error', e); wx.showToast({ title:'支付未完成', icon:'none' }) }
    finally{ this.setData({ _busy:false }) }
  }
})
