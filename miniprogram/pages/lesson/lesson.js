Page({
  data: {
    courseId: '',
    lessonId: '',
    title: '',
    videoUrl: '',
    authorized: false
  },
  onLoad(options) {
    const { courseId, lessonId, title } = options;
    this.setData({ courseId, lessonId, title });
    this.loadVideo();
  },
  loadVideo() {
    wx.showLoading({ title: '加载视频...' });
    wx.cloud.callFunction({
      name: 'getLessonUrl',
      data: {
        courseId: this.data.courseId,
        lessonId: this.data.lessonId
      }
    }).then(res => {
      this.setData({
        videoUrl: res.result.videoUrl,
        authorized: true,
      });
    }).catch(err => {
      console.error(err);
      this.setData({ authorized: false });
      wx.showToast({ title: '请先购买课程', icon: 'none' });
    }).finally(() => {
      wx.hideLoading();
    });
  }
});