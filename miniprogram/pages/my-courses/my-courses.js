Page({
  data: {
    courses: []
  },
  onShow() {
    this.loadMyCourses();
  },
  async loadMyCourses() {
    const db = wx.cloud.database();
    try {
      // 查询已支付订单
      const ordersRes = await db.collection('orders').where({ status: 'paid' }).get();
      const orderList = ordersRes.data;
      if (!orderList || orderList.length === 0) {
        this.setData({ courses: [] });
        return;
      }
      const ids = orderList.map(item => item.courseId);
      const _ = db.command;
      const coursesRes = await db.collection('courses').where({ _id: _.in(ids) }).get();
      this.setData({ courses: coursesRes.data });
    } catch (e) {
      console.error(e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },
  goCourse(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/course-detail/detail?courseId=' + id });
  },
});