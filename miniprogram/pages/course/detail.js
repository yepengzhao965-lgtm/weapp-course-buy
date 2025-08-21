import { callFunction } from '../../utils/cloud'
Page({
  data:{ id:'', course:null },
  onLoad(q){ this.setData({ id: (q && q.id) ? q.id : '' }); this.fetch() },
  async fetch(){
    try{
      const r = await callFunction('courses', { action:'get', id:this.data.id })
      const course = (r && r.result && r.result.course) ? r.result.course : null
      if (course) course.priceYuan = (course.price/100).toFixed(2)
      this.setData({ course: course })
    }catch(e){ console.error(e); wx.showToast({ title:'加载失败', icon:'none' }) }
  },
  buy(){ wx.navigateTo({ url:'/pages/checkout/index?id='+this.data.id }) }
})
