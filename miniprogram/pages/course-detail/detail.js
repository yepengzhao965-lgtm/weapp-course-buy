Page({
  data: {
    courseId: '',
    course: {},
    lessons: []
  },
  onLoad(options) {
    const { courseId } = options;
    this.setData({ courseId });
    this.loadCourse(courseId);
  },
  async loadCourse(id) {
    const db = wx.cloud.database();
    wx.showLoading({ title: '加载中...' });
    try {
      const courseRes = await db.collection('courses').doc(id).get();
      const lessonsRes = await db.collection('lessons')
        .where({ courseId: id })
        .orderBy('order', 'asc')
        .get();
      this.setData({
        course: courseRes.data,
        lessons: lessonsRes.data,
      });
    } catch (e) {
      console.error(e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },
  goCheckout() {
    wx.navigateTo({ url: '/pages/checkout/checkout?courseId=' + this.data.courseId });
  },
  goLesson(e) {
    const { id, title } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/lesson/lesson?courseId=${this.data.courseId}&lessonId=${id}&title=${title}`,
    });
  },
});