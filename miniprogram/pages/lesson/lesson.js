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
      let message = '加载失败，请稍后重试';
      let authorized = false;
      if (err.message === 'NOT_AUTHORIZED') {
        message = '请先购买课程';
        authorized = false;
      } else if (err.message === 'NO_VIDEO') {
        message = '视频资源不存在';
      }
      this.setData({ authorized });
      wx.showToast({ title: message, icon: 'none' });
    }).finally(() => {
      wx.hideLoading();
    });
  }
});