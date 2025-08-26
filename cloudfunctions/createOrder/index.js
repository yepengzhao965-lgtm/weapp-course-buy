const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const crypto = require('crypto')
const fetch = require('node-fetch')

const MCHID = process.env.MCHID
const APPID = process.env.APPID
const SERIAL_NO = process.env.SERIAL_NO
const PRIVATE_KEY = (process.env.MCH_PRIVATE_KEY || '').replace(/\\n/g, '\n')
const NOTIFY_URL = process.env.NOTIFY_URL
const DEV_MOCK_PAY = (process.env.DEV_MOCK_PAY || '').toLowerCase() === 'true'

function rsaSign(s){
  const signer = crypto.createSign('RSA-SHA256'); signer.update(s); signer.end()
  return signer.sign(PRIVATE_KEY, 'base64')
}

exports.main = async (event) => {
  const { courseId } = event || {}
  const { OPENID } = cloud.getWXContext()
  if (!courseId) return { code:-1, message:'缺少 courseId' }

  // 取课程
  const c = await db.collection('courses').doc(courseId).get().catch(()=>null)
  if (!c || !c.data) return { code:-1, message:'课程不存在' }
  const total = Number(c.data.price || 0)

  // 【兜底】支付没配置 → 直接走开发模式
  const payNotReady = !MCHID || !APPID || !SERIAL_NO || !PRIVATE_KEY || !NOTIFY_URL
  if (payNotReady) {
    if (!DEV_MOCK_PAY) return { code:-1, message: '支付未配置' }
    const outTradeNo = `O${Date.now()}${Math.floor(Math.random()*1000)}`
    const now = new Date()
    const addRes = await db.collection('orders').add({
      data:{
        openid: OPENID,
        outTradeNo,
        courseId,
        amount: total,
        status:'PAID',
        paidAt: now,
        payResult:{ mock:true },
        createdAt: now,
        updatedAt: now
      }
    })
    return { code:0, data:{ devMock:true, outTradeNo, orderId:addRes._id } }  // 已自动标记为已支付
  }

  if (total < 1) return { code:-1, message:'金额必须≥1分' }

  // —— 以下为正式 JSAPI 下单（之前给你的逻辑不变） ——
  try{
    const outTradeNo = `O${Date.now()}${Math.floor(Math.random()*1000)}`
    const now = new Date()
    await db.collection('orders').add({
      data:{ openid: OPENID, outTradeNo, courseId, amount: total, status:'CREATED', createdAt: now, updatedAt: now }
    })

    const url = 'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi'
    const body = {
      appid: APPID, mchid: MCHID, description: c.data.title || '课程购买',
      out_trade_no: outTradeNo, notify_url: NOTIFY_URL,
      amount: { total, currency: 'CNY' }, payer: { openid: OPENID }
    }
    const nonce = crypto.randomBytes(16).toString('hex')
    const ts = Math.floor(Date.now()/1000).toString()
    const signMsg = `POST\n/v3/pay/transactions/jsapi\n${ts}\n${nonce}\n${JSON.stringify(body)}\n`
    const signature = rsaSign(signMsg)
    const auth = `WECHATPAY2-SHA256-RSA2048 mchid="${MCHID}",nonce_str="${nonce}",signature="${signature}",timestamp="${ts}",serial_no="${SERIAL_NO}"`

    const resp = await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json','Authorization':auth }, body:JSON.stringify(body) })
    const data = await resp.json().catch(()=>({}))
    if (!resp.ok || !data.prepay_id) return { code:-2, message: data.message || '统一下单失败', detail:data }

    const pkg = `prepay_id=${data.prepay_id}`
    const paySignStr = `${APPID}\n${ts}\n${nonce}\n${pkg}\n`
    const paySign = rsaSign(paySignStr)

    return { code:0, data:{ timeStamp:ts, nonceStr:nonce, package:pkg, signType:'RSA', paySign, outTradeNo } }
  }catch(e){
    console.error('createOrder error:', e)
    return { code:-3, message:String(e && e.message || e) }
  }
}
