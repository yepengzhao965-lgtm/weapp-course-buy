const app = getApp()

Page({
  data: {
    list: [],
    loading: false,
    empty: false
  },

  async onShow() { this.loadPurchased() },

  async loadPurchased() {
    try {
      this.setData({ loading: true })
      const openid = await app.ensureOpenid()
      const db = wx.cloud.database()
      const _ = db.command

      // 1) 取已支付订单
      const or = await db.collection('orders')
        .where({ _openid: openid, status: 'paid' })
        .orderBy('paidAt', 'desc')
        .get()

      const orders = or.data || []
      if (!orders.length) { this.setData({ list: [], empty: true, loading: false }); return }

      // 2) 批量取课程
      const ids = orders.map(o => o.courseId).filter(Boolean)
      const cr = await db.collection('courses').where({ _id: _.in(ids) }).get()
      const cmap = {}
      ;(cr.data || []).forEach(c => cmap[c._id] = c)

      // 3) 组装展示
      const list = orders.map(o => ({
        orderId: o._id,
        outTradeNo: o.outTradeNo,
        paidAt: o.paidAt || o.createdAt,
        courseId: o.courseId,
        title: (cmap[o.courseId] && cmap[o.courseId].title) || '课程已下架',
        brief: (cmap[o.courseId] && cmap[o.courseId].brief) || '',
        price: (o.price || 0),
        displayPrice: ((o.price || 0) / 100).toFixed(2)
      }))

      this.setData({ list, empty: false })
    } catch (e) {
      console.error(e)
      wx.showToast({ title: '加载已购失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: `/pages/course-detail/detail?courseId=${id}` })
  }
})
