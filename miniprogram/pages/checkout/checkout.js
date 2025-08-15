// miniprogram/pages/checkout/checkout.js
const app = getApp();

Page({
  data: {
    courseId: '',
    course: null,
    isPaid: false,
    orderId: '',
    outTradeNo: '',
    paying: false
  },

  async onLoad(query) {
    const courseId = (query && query.courseId) || '';
    if (!courseId) {
      wx.showToast({ title: '缺少课程ID', icon: 'none' });
      return;
    }
    this.setData({ courseId });
    await this.loadCourse();
    await this.checkOwned();
  },

  async loadCourse() {
    try {
      wx.showLoading({ title: '加载中...' });
      const db = wx.cloud.database();
      const r = await db.collection('courses').doc(this.data.courseId).get();
      const yuan = ((r.data && r.data.price ? r.data.price : 0) / 100).toFixed(2);
      this.setData({ course: { ...r.data, displayPrice: yuan } });
    } catch (e) {
      console.error(e);
      wx.showToast({ title: '课程加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },
  async checkOwned() {
    try {
      const openid = await app.ensureOpenid();
      if (!openid) return;
      const db = wx.cloud.database();
      const r = await db.collection('orders').where({
        _openid: openid,
        courseId: this.data.courseId,
        status: 'paid'
      }).limit(1).get();
      if (r.data && r.data.length) {
        this.setData({ isPaid: true });
        wx.showToast({ title: '您已购买该课程', icon: 'none' });
      }
    } catch (e) {
      console.error('checkOwned error:', e);
    }
  },
  async createOrder() {
    if (this.data.isPaid) {
      wx.showToast({ title: '您已购买该课程', icon: 'none' });
      return;
    }
    if (this.data.paying) return;
    this.setData({ paying: true });

    let cr = null;
    try {
      const openid = await app.ensureOpenid();
      if (!openid) { wx.showToast({ title: '请先登录', icon: 'none' }); return; }

      wx.showLoading({ title: '下单中...' });

      cr = await wx.cloud.callFunction({
        name: 'createOrder',
        data: { courseId: this.data.courseId }
      });

      const raw = (cr && cr.result) || {};
      console.log('createOrder raw ->', raw);

      // 兼容两种返回：{code:0,data:{...}} 或 直接 {orderId,outTradeNo,...}
      const normalize = (r) => {
        if (typeof r.code !== 'undefined') {
          if (r.code === 0 && r.data) return { ok: true, data: r.data };
          return { ok: false, msg: r.message || (r.detail ? JSON.stringify(r.detail) : JSON.stringify(r)) };
        }
        if (r && (r.orderId || r.outTradeNo)) {
          return { ok: true, data: { ...r, devMock: (typeof r.devMock === 'boolean' ? r.devMock : true) } };
        }
        return { ok: false, msg: JSON.stringify(r) };
      };

      const norm = normalize(raw);
      if (!norm.ok) {
        wx.showModal({ title: '下单失败', content: norm.msg || '未知原因', showCancel: false });
        return;
      }

      const data = norm.data || {};
      const outTradeNo = data.outTradeNo || '';
      const orderId    = data.orderId || '';
      this.setData({ outTradeNo, orderId });

      // 开发/模拟：直接标记已支付
      if (data.devMock || (app.globalData && app.globalData.mockPay)) {
       
        wx.hideLoading();
        wx.showToast({ title: '支付成功（开发模式）' });
        this.setData({ isPaid: true });
        setTimeout(() => wx.redirectTo({ url: '/pages/my-courses/my-courses' }), 600);
        return;
      }

      // 正式支付
      wx.hideLoading();
      await wx.requestPayment({
        timeStamp: data.timeStamp,
        nonceStr:  data.nonceStr,
        package:   data.package,
        signType:  data.signType || 'RSA',
        paySign:   data.paySign
      });

      await this._waitPaid({ outTradeNo, orderId });

    } catch (e) {
      console.error('pay_error:', e, 'raw:', cr);
      const msg = (e && (e.message || e.errMsg)) || '支付取消/失败';
      wx.showToast({ title: msg, icon: 'none' });
    } finally {
      wx.hideLoading();
      this.setData({ paying: false });
    }
  },

  // ===== helpers =====
 

  // 轮询订单状态，等待回调把订单改为 paid
  async _waitPaid({ outTradeNo, orderId }) {
    wx.showLoading({ title: '确认支付中...' });
    const db = wx.cloud.database();
    let tries = 0;

    const checkOnce = async () => {
      tries++;
      try {
        let paid = false;
        if (outTradeNo) {
          const r = await db.collection('orders').where({ outTradeNo }).get();
          const od = r.data && r.data[0];
          paid = !!(od && od.status === 'paid');
        } else if (orderId) {
          const r = await db.collection('orders').doc(orderId).get();
          paid = !!(r.data && r.data.status === 'paid');
        }
        if (paid) {
          wx.hideLoading();
          wx.showToast({ title: '支付成功' });
          this.setData({ isPaid: true });
          wx.redirectTo({ url: '/pages/my-courses/my-courses' });
          return true;
        }
      } catch (e) {
        console.warn('check order error:', e);
      }
      return false;
    };

    const loop = async () => {
      const ok = await checkOnce();
      if (ok) return;
      if (tries < 10) setTimeout(loop, 1500);
      else {
        wx.hideLoading();
        wx.showToast({ title: '未确认支付，可稍后在已购查看', icon: 'none' });
      }
    };
    loop();
  }
});
