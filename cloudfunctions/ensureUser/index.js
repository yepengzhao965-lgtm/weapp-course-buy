const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const users = db.collection('users')
  const now = new Date()
  const profile = event && event.profile ? event.profile : {}
  const data = {
    nickName: profile.nickName || '',
    avatarUrl: profile.avatarUrl || '',
    gender: profile.gender || 0,
    country: profile.country || '',
    province: profile.province || '',
    city: profile.city || '',
    updatedAt: now
  }

  try {
    await users.doc(OPENID).update({ data })
  } catch (e) {
    await users.doc(OPENID).set({ data: { _openid: OPENID, role: 'buyer', createdAt: now, ...data } })
  }
  const got = await users.doc(OPENID).get()
  return { user: got.data }
}
