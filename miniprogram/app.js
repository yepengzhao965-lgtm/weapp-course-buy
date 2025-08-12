App({
  /**
   * 全局数据，可在各个页面通过 getApp().globalData 访问
   */
  globalData: {},

  /**
   * 小程序初始化完成时触发
   */
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        // 将此处替换为云开发环境 ID
        // 查看环境 ID：在微信开发者工具云开发控制台点击详情可查看
        env: 'cloud1-3gvvy78d0e8953d4',
        traceUser: true,
      });
    }
  },
});