const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const code = event && event.code
  if(!code) return { ok:false, msg:'missing code' }

  // 官方 openapi：用 code 换手机号
  const res = await cloud.openapi.phonenumber.getPhoneNumber({ code }).catch(e => ({ err: e }))
  if(res && res.err) return { ok:false, msg: res.err.errMsg || String(res.err) }
  const phone = (res && res.phoneInfo && (res.phoneInfo.phoneNumber || res.phoneInfo.phoneNumberPure)) || res.phoneNumber
  if(!phone) return { ok:false, msg:'no phone' }

  // 写库（users 表，主键用 OPENID）
  const users = db.collection('users')
  const now = new Date()
  try { await users.doc(OPENID).update({ data: { mobile: phone, mobileVerified: true, updatedAt: now } }) }
  catch { await users.doc(OPENID).set({ data: { _openid: OPENID, role:'buyer', createdAt: now, mobile: phone, mobileVerified: true, updatedAt: now } }) }

  const user = (await users.doc(OPENID).get()).data
  return { ok:true, phone, user }
}
