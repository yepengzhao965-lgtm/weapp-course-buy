Page({
  data: {
    courses: [],
    page: 0,
    pageSize: 10,
    hasMore: true,
    loading: false,
  },
  onLoad() {
    this.loadCourses();
  },
  loadCourses() {
    if (this.data.loading || !this.data.hasMore) {
      return;
    }
    this.setData({ loading: true });
    wx.showLoading({ title: '加载中...' });
    const nextPage = this.data.page + 1;
    wx.cloud.callFunction({
      name: 'listCourses',
      data: { page: nextPage, pageSize: this.data.pageSize },
    }).then(res => {
      const list = res.result || [];
      this.setData({
        courses: this.data.courses.concat(list),
        page: nextPage,
        hasMore: list.length === this.data.pageSize,
      });
    }).catch(err => {
      console.error(err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }).finally(() => {
      this.setData({ loading: false });
      wx.hideLoading();
    });
  },
  onReachBottom() {
    this.loadCourses();
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/course-detail/detail?courseId=' + id,
    });
  },
});