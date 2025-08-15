const cloud = require('wx-server-sdk')
const { isAuthorized } = require('../common/auth')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  if (!isAuthorized(OPENID, CLIENTIP)) {
    return { code: -1 };
  }
  const { orderId, outTradeNo } = event || {}
  if (!orderId && !outTradeNo) return { code: -1, message: '缺少 orderId/outTradeNo' }

  const where = orderId ? { _id: orderId } : { outTradeNo }
  const r = await db.collection('orders').where(where).get()
  if (!r.data || !r.data.length) return { code: -1, message: '订单不存在' }

  await db.collection('orders').where(where).update({
    data: { status: 'paid', paidAt: new Date(), payResult: { mock: true } }
  })
  return { code: 0, message: 'ok' }
}
