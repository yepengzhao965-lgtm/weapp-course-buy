
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const code = event && event.code
  if (!code) return { ok:false, msg:'missing code' }

  // 调用 openapi 获取手机号
  const res = await cloud.openapi.phonenumber.getPhoneNumber({ code })
  const phone = res && res.phoneInfo && (res.phoneInfo.phoneNumber || res.phoneInfo.phoneNumberPure || res.phoneNumber) || res.phoneNumber
  if (!phone) return { ok:false, msg:'no phone' }

  // 存到 users
  const users = db.collection('users')
  const now = new Date()
  try {
    await users.doc(OPENID).update({ data: { mobile: phone, mobileVerified: true, updatedAt: now } })
  } catch (e) {
    await users.doc(OPENID).set({ data: { _openid: OPENID, role:'buyer', createdAt: now, mobile: phone, mobileVerified: true, updatedAt: now } })
  }
  const got = await users.doc(OPENID).get()
  return { ok:true, phone, user: got.data }
}
