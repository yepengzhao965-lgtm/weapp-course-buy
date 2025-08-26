// HTTP 触发云函数，处理微信支付 v3 异步通知
const cloud = require('wx-server-sdk')
const crypto = require('crypto')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const orders = db.collection('orders') // 若你的集合名为 'order'，改这里

const API_V3_KEY = (process.env.API_V3_KEY || '').trim()  // 32字节
// 可选：如果你要校验微信平台签名，可把平台证书 PEM 放到 WX_PLATFORM_CERT 环境变量
const WX_PLATFORM_CERT = (process.env.WX_PLATFORM_CERT || '').trim()

function decryptResource(resource){
  const { associated_data, nonce, ciphertext } = resource
  const key = Buffer.from(API_V3_KEY, 'utf8')
  const buf = Buffer.from(ciphertext, 'base64')
  const authTag = buf.slice(buf.length - 16)
  const data = buf.slice(0, buf.length - 16)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce)
  if (associated_data) decipher.setAAD(Buffer.from(associated_data, 'utf8'))
  decipher.setAuthTag(authTag)
  const decoded = Buffer.concat([decipher.update(data), decipher.final()])
  return JSON.parse(decoded.toString('utf8'))
}

// 简易签名校验（可选）
function verifySignature(headers, body){
  if (!WX_PLATFORM_CERT) return true // 未配置平台证书则跳过校验
  try{
    const serial = headers['wechatpay-serial'] || headers['Wechatpay-Serial'] || ''
    const nonce = headers['wechatpay-nonce'] || headers['Wechatpay-Nonce'] || ''
    const timestamp = headers['wechatpay-timestamp'] || headers['Wechatpay-Timestamp'] || ''
    const signature = headers['wechatpay-signature'] || headers['Wechatpay-Signature'] || ''
    const message = `${timestamp}\n${nonce}\n${body}\n`
    const verify = crypto.createVerify('RSA-SHA256')
    verify.update(message); verify.end()
    const cert = WX_PLATFORM_CERT
    return verify.verify(cert, signature, 'base64')
  }catch(e){ return false }
}

exports.main = async (event, context) => {
  const headers = event.headers || {}
  const bodyStr = typeof event.body === 'string' ? event.body : JSON.stringify(event.body || {})
  if (!API_V3_KEY){
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code:'FAIL', message:'API_V3_KEY missing' }) }
  }
  if (!verifySignature(headers, bodyStr)){
    return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code:'FAIL', message:'signature verify fail' }) }
  }

  try{
    const notify = JSON.parse(bodyStr)
    const resource = decryptResource(notify.resource)
    // resource.trade_state === 'SUCCESS'
    const outTradeNo = resource.out_trade_no
    const transactionId = resource.transaction_id || ''
    const payerOpenid = resource.payer && resource.payer.openid
    const total = resource.amount && Number(resource.amount.total || 0)
    if (resource.trade_state === 'SUCCESS' && outTradeNo){
      const r = await orders.where({ outTradeNo }).get()
      if (r.data.length){
        await orders.doc(r.data[0]._id).update({ data:{ status:'PAID', transactionId, paidAt:new Date(), openid:payerOpenid, amount: total, updatedAt:new Date() } })
      }
    }
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code:'SUCCESS', message:'成功' }) }
  }catch(e){
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code:'FAIL', message: e.message || String(e) }) }
  }
}
