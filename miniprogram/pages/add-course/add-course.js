Page({
  data: {
    title: '',
    brief: '',
    price: '',
    cover: '',
    coverTemp: ''
  },
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },
  chooseCover() {
    wx.chooseImage({
      count: 1,
      success: chooseRes => {
        const filePath = chooseRes.tempFilePaths[0];
        const cloudPath = 'course-covers/' + Date.now() + '-' + Math.random().toString(36).slice(2) + filePath.match(/\.[^.]+$/)[0];
        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: upRes => {
            this.setData({ cover: upRes.fileID, coverTemp: filePath });
          },
          fail: () => wx.showToast({ title: '上传失败', icon: 'none' })
        });
      }
    });
  },
  onSubmit() {
    const { title, brief, price, cover } = this.data;
    if (!title) { wx.showToast({ title: '请输入标题', icon: 'none' }); return; }
    const cents = Math.round(parseFloat(price) * 100) || 0;
    wx.showLoading({ title: '提交中...' });
    wx.cloud.callFunction({
      name: 'addCourse',
      data: { title, brief, price: cents, cover }
    }).then(() => {
      wx.showToast({ title: '已添加', icon: 'success' });
      this.setData({ title: '', brief: '', price: '', cover: '', coverTemp: '' });
    }).catch(err => {
      console.error(err);
      wx.showToast({ title: '添加失败', icon: 'none' });
    }).finally(() => {
      wx.hideLoading();
    });
  }
});
