import { callFunction } from '../../utils/cloud'
Page({
  data:{ list:[] },
  async onLoad(){ await this.fetchCourses() },
  async onShow(){ await this.fetchCourses() },
  async fetchCourses(){
    try{
      const r = await callFunction('courses', { action:'list' })
      const raw = (r && r.result && r.result.list) ? r.result.list : []
      const list = raw.map(function(it){ var copy = {}; for (var k in it){ if (Object.prototype.hasOwnProperty.call(it,k)) copy[k]=it[k] } copy.priceYuan = (it.price/100).toFixed(2); return copy })
      this.setData({ list: list })
    }catch(e){ console.error(e); wx.showToast({ title:'加载失败', icon:'none' }) }
  },
  goDetail(e){ const id = e.currentTarget.dataset.id; wx.navigateTo({ url:'/pages/course/detail?id='+id }) }
})
