const cloud = require('wx-server-sdk')
const { isAuthorized } = require('../common')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

  exports.main = async (event, context) => {
    // 通过 getWXContext() 获取请求者的 OPENID 与 IP，用于管理员授权
  const ctx = (typeof cloud.getWXContext === 'function') ? cloud.getWXContext() : {}
  const OPENID   = ctx.OPENID || (event && event.userInfo && event.userInfo.openId) || ''
  const CLIENTIP = ctx.CLIENTIP || ''
  if (!isAuthorized(OPENID, CLIENTIP)) {
      return { code: -1, message: 'unauthorized' }
    }
  const { orderId, outTradeNo } = event || {}
  if (!orderId && !outTradeNo) return { code: -1, message: '缺少 orderId/outTradeNo' }

  const where = orderId ? { _id: orderId } : { outTradeNo }
    const r = await db.collection('orders').where(where).limit(1).get()
    if (!r.data || !r.data.length) {
      return { code: -1, message: '订单不存在' }
    }
    const order = r.data[0]
    const targetId = order._id
    const now = new Date()
    // 手动标记支付，记录手工标记来源
    await db.collection('orders').doc(targetId).update({
      data: {
        status: 'PAID',
        paidAt: now,
        openid: order.openid || '',
        amount: order.amount || 0,
        updatedAt: now,
        payResult: { manual: true }
      }
    })
    return { code: 0, message: 'ok' }
}
