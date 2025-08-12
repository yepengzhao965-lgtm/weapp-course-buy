Page({
  data: {
    courseId: '',
    course: {},
    isPaid: false
  },
  onLoad(options) {
    const { courseId } = options;
    this.setData({ courseId });
    this.loadCourse();
  },
  async loadCourse() {
    const db = wx.cloud.database();
    try {
      const res = await db.collection('courses').doc(this.data.courseId).get();
      this.setData({ course: res.data });
    } catch (e) {
      console.error(e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },
  createOrder() {
    wx.showLoading({ title: '下单中...' });
    wx.cloud.callFunction({
      name: 'createOrder',
      data: {
        courseId: this.data.courseId,
      },
    }).then(res => {
      // 开发模式：直接标记为已支付
      return wx.cloud.callFunction({
        name: 'markOrderPaid',
        data: { orderId: res.result.orderId },
      });
    }).then(() => {
      this.setData({ isPaid: true });
      wx.showToast({ title: '购买成功' });
    }).catch(err => {
      console.error(err);
      wx.showToast({ title: '支付失败', icon: 'none' });
    }).finally(() => {
      wx.hideLoading();
    });
  },
});