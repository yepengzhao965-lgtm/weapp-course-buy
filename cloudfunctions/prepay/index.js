const cloud = require('wx-server-sdk')
const https = require('https')
const crypto = require('crypto')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const orders = db.collection('orders') // 若你的集合名为 'order'，改这里

const env = process.env || {}
const APPID = (env.APPID || '').trim()
const MCH_ID = (env.MCH_ID || '').trim()
const MCH_SERIAL_NO = (env.MCH_SERIAL_NO || '').trim()
const MCH_PRIVATE_KEY = (env.MCH_PRIVATE_KEY || '').trim()
const MOCK_PAY = (env.MOCK_PAY || '').trim()
const NOTIFY_URL = (env.NOTIFY_URL || '').trim()

function isValidPEM(k){
  if (!k) return false
  const hasPem = k.includes('BEGIN') && k.includes('PRIVATE KEY') && k.includes('END')
  return hasPem && k.length > 300
}

function signMessage(message, privateKey){
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(message); sign.end()
  return sign.sign(privateKey, 'base64')
}

function buildAuthorization(method, urlPath, body){
  const timestamp = Math.floor(Date.now()/1000).toString()
  const nonceStr = crypto.randomBytes(16).toString('hex')
  const message = method + '\n' + urlPath + '\n' + timestamp + '\n' + nonceStr + '\n' + body + '\n'
  const signature = signMessage(message, MCH_PRIVATE_KEY)
  const token = `mchid="${MCH_ID}",serial_no="${MCH_SERIAL_NO}",nonce_str="${nonceStr}",timestamp="${timestamp}",signature="${signature}"`
  return { authorization: 'WECHATPAY2-SHA256-RSA2048 ' + token, nonceStr, timestamp }
}

exports.main = async (event)=>{
  const { OPENID } = cloud.getWXContext()
  const outTradeNo = event && event.outTradeNo
  if (!outTradeNo) return { err: 'missing outTradeNo' }

  const r = await orders.where({ outTradeNo, openid: OPENID }).get()
  if (!r.data.length) return { err: 'order not found' }
  const order = r.data[0]
  if (order.status === 'PAID') return { mockPaid: true }

  // 如果环境未配置完整，直接 mock（开发期）
  const needMock = (MOCK_PAY === 'true') || !APPID || !MCH_ID || !MCH_SERIAL_NO || !isValidPEM(MCH_PRIVATE_KEY)
  if (needMock){
    const now = new Date()
    await orders.doc(order._id).update({ data: { status: 'PAID', paidAt: now, openid: OPENID, amount: order.amount, updatedAt: now, transactionId: 'MOCK' } })
    return { mockPaid: true }
  }

  // 真实 JSAPI 预下单
  const bodyObj = {
    appid: APPID,
    mchid: MCH_ID,
    description: order.title || '课程购买',
    out_trade_no: outTradeNo,
    notify_url: NOTIFY_URL,  // 必须是公网 HTTPS，建议指向 payNotify 的 HTTP 触发 URL
    amount: { total: order.amount, currency: 'CNY' },
    payer: { openid: OPENID }
  }
  const body = JSON.stringify(bodyObj)
  const path = '/v3/pay/transactions/jsapi'
  const { authorization } = buildAuthorization('POST', path, body)

  const options = {
    hostname: 'api.mch.weixin.qq.com',
    path, method: 'POST',
    headers: { 'Authorization': authorization, 'Content-Type':'application/json', 'Accept':'application/json' }
  }

  const prepay = await new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', d => data += d)
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch(e){ reject(e) } })
    })
    req.on('error', reject); req.write(body); req.end()
  })

  if (!prepay || !prepay.prepay_id) return { err: 'prepay failed', detail: prepay }

  const pkg = 'prepay_id=' + prepay.prepay_id
  const payTimestamp = Math.floor(Date.now()/1000).toString()
  const payNonce = crypto.randomBytes(16).toString('hex')
  const signStr = APPID + '\n' + payTimestamp + '\n' + payNonce + '\n' + pkg + '\n'
  const paySign = signMessage(signStr, MCH_PRIVATE_KEY)

  return { timeStamp: payTimestamp, nonceStr: payNonce, package: pkg, signType:'RSA', paySign }
}
