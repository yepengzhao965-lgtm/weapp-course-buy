/**
 * 公共模块（不要作为云函数部署）。
 * 放置路径：cloudfunctions/common
 * 在各云函数中这样引用： const common = require('../common')
 */
const cloud = require('wx-server-sdk')

// 简单工具
function ok(data = {}) { return { ok: true, ...data } }
function fail(code = -1, message = 'error', extra = {}) { return { ok: false, code, message, ...extra } }
function pick(obj = {}, keys = []) { const o = {}; keys.forEach(k => { if (Object.prototype.hasOwnProperty.call(obj, k)) o[k] = obj[k] }); return o }
function safeToNumber(x, def = 0){ const n = Number(x); return Number.isFinite(n) ? n : def }

// 管理员校验：通过环境变量 ADMIN_OPENIDS（逗号分隔）/ ADMIN_IP_WHITELIST（逗号分隔，可选）控制
function isAuthorized(openid = '', clientIp = ''){
  const env = process.env || {}
  const openids = String(env.ADMIN_OPENIDS || '').split(',').map(s => s.trim()).filter(Boolean)
  const ips = String(env.ADMIN_IP_WHITELIST || '').split(',').map(s => s.trim()).filter(Boolean)
  const openidPass = !!openid && (openids.length === 0 || openids.includes(openid))
  const ipPass = ips.length === 0 || (clientIp && ips.includes(clientIp))
  return openidPass && ipPass
}

// 获取当前用户 openid/appid/unionid
function getContext(){
  const ctx = cloud.getWXContext ? cloud.getWXContext() : {}
  return { OPENID: ctx.OPENID || '', APPID: ctx.APPID || '', UNIONID: ctx.UNIONID || '', CLIENTIP: ctx.CLIENTIP || '' }
}

// 确保用户记录存在并更新（users 集合，主键为 openid）
async function ensureUser(db, updates = {}){
  const { OPENID } = getContext()
  const users = db.collection('users')
  const now = new Date()
  const data = { updatedAt: now, ...updates }
  try{
    await users.doc(OPENID).update({ data })
  }catch(e){
    await users.doc(OPENID).set({ data: { role: 'buyer', createdAt: now, ...data } })
  }
  const got = await users.doc(OPENID).get()
  return got.data
}

// （可选）微信支付 v3 辅助：签名 & Authorization 生成（若你想在多个函数复用）
const crypto = require('crypto')
function signMessageRSASHA256(message, privateKeyPem){
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(message); sign.end()
  return sign.sign(privateKeyPem, 'base64')
}
function buildWxPayV3Auth({ method, path, body, mchId, mchSerialNo, privateKeyPem }){
  const timestamp = Math.floor(Date.now()/1000).toString()
  const nonceStr = crypto.randomBytes(16).toString('hex')
  const message = `${method}\n${path}\n${timestamp}\n${nonceStr}\n${body}\n`
  const signature = signMessageRSASHA256(message, privateKeyPem)
  const token = `mchid="${mchId}",serial_no="${mchSerialNo}",nonce_str="${nonceStr}",timestamp="${timestamp}",signature="${signature}"`
  return { authorization: 'WECHATPAY2-SHA256-RSA2048 ' + token, nonceStr, timestamp }
}

module.exports = {
  ok, fail, pick, safeToNumber,
  isAuthorized, getContext, ensureUser,
  signMessageRSASHA256, buildWxPayV3Auth,
}
