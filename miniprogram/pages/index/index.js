Page({
  data: {
    courses: []
  },
  onLoad() {
    wx.showLoading({ title: '加载中...' });
    wx.cloud.callFunction({
      name: 'listCourses',
    }).then(res => {
      this.setData({ courses: res.result || [] });
    }).catch(err => {
      console.error(err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }).finally(() => {
      wx.hideLoading();
    });
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/course-detail/detail?courseId=' + id,
    });
  },
});