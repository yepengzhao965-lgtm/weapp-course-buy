/* 云函数路径：cloudfunctions/payNotify/index.js */

const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 必须在函数配置中设置 32 字节的 API_V3_KEY 以解密通知
const API_V3_KEY = process.env.API_V3_KEY

exports.main = async (event) => {
  // 返回响应的帮助函数
  const httpResponse = (statusCode, bodyObj) => {
    return {
      statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyObj)
    }
  }

  try {
    // WeChat Pay 通知体是 JSON 字符串
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : (event.body || {})
    const resource = body.resource || {}
    if (!resource.ciphertext || !resource.nonce) {
      return httpResponse(400, { code: 'INVALID_NOTIFICATION' })
    }

    if (!API_V3_KEY || API_V3_KEY.length !== 32) {
      console.error('API_V3_KEY 未配置或长度不正确')
      return httpResponse(500, { code: 'NO_API_V3_KEY' })
    }

    // 解密过程：AES‑256‑GCM
    const key      = Buffer.from(API_V3_KEY, 'utf8')
    const nonceBuf = Buffer.from(resource.nonce, 'utf8')
    const cipher   = Buffer.from(resource.ciphertext, 'base64')
    const data     = cipher.slice(0, cipher.length - 16)
    const tag      = cipher.slice(cipher.length - 16)
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonceBuf)
    decipher.setAuthTag(tag)
    if (resource.associated_data) {
      decipher.setAAD(Buffer.from(resource.associated_data, 'utf8'))
    }
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
    const payResult = JSON.parse(decrypted.toString())

    // 只处理支付成功的通知
    if (payResult.trade_state !== 'SUCCESS') {
      return httpResponse(200, { code: 'IGNORED' })
    }
    const outTradeNo = payResult.out_trade_no
    if (!outTradeNo) {
      return httpResponse(400, { code: 'NO_OUT_TRADE_NO' })
    }

    // 查找订单并更新
    const orderRes = await db.collection('orders')
      .where({ outTradeNo })
      .limit(1)
      .get()
    if (!orderRes.data || !orderRes.data.length) {
      return httpResponse(200, { code: 'ORDER_NOT_FOUND' })
    }
    const orderDoc = orderRes.data[0]
    await db.collection('orders').doc(orderDoc._id).update({
      data: {
        status : 'paid',
        paidAt : new Date(),
        payResult  // 保存支付回调完整信息，方便对账
      }
    })
    return httpResponse(200, { code: 'SUCCESS' })
  } catch (err) {
    console.error('payNotify error:', err)
    return httpResponse(500, { code: 'ERROR', message: err.message || String(err) })
  }
}
