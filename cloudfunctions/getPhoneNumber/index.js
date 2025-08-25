const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const code = event && event.code
  if(!code) return { ok:false, msg:'missing code' }

  const res = await cloud.openapi.phonenumber.getPhoneNumber({ code })
  const phone = (res && res.phoneInfo && (res.phoneInfo.phoneNumber || res.phoneInfo.phoneNumberPure)) || res.phoneNumber
  if(!phone) return { ok:false, msg:'no phone' }

  const users = db.collection('users')
  const now = new Date()
  try { await users.doc(OPENID).update({ data: { mobile: phone, mobileVerified: true, updatedAt: now } }) }
  catch { await users.doc(OPENID).set({ data: { _openid: OPENID, role:'buyer', createdAt: now, mobile: phone, mobileVerified: true, updatedAt: now } }) }

  return { ok:true, phone, user: (await users.doc(OPENID).get()).data }
}
