const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const users = db.collection('users')
  const now = new Date()
  const p = (event && event.profile) || {}

  const base = {
    nickName: p.nickName || '',
    avatarUrl: p.avatarUrl || '',
    gender: p.gender || 0,
    country: p.country || '',
    province: p.province || '',
    city: p.city || '',
    updatedAt: now
  }

  try { await users.doc(OPENID).update({ data: base }) }
  catch { await users.doc(OPENID).set({ data: { openid: OPENID, role:'buyer', createdAt: now, ...base } }) }

  const got = await users.doc(OPENID).get()
  return { ok:true, user: got.data }
}
