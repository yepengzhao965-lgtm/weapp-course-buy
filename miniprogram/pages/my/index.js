Page({
  data:{ list:[], busy:false },
  onShow(){ this.fetch && this.fetch() },
  async fetch(){
    if(this.data.busy) return; this.setData({ busy:true })
    try{
      const r = await wx.cloud.callFunction({ name:'orders', data:{ action:'mine' } })
      let list = (r && r.result && r.result.list) ? r.result.list : []
      list = list.map(x => { x.priceYuan = (Number(x.amount||0)/100).toFixed(2); return x })
      this.setData({ list })
    }catch(e){
      console.error(e); wx.showToast({ title:'加载失败', icon:'none' })
    }finally{
      this.setData({ busy:false })
    }
  }
})
