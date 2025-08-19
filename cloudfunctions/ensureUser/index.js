const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { OPENID, UNIONID } = cloud.getWXContext();
  const db = cloud.database();
  const users = db.collection('users');

  const { nickName, avatarUrl, phoneNumber } = event || {};
  const now = new Date();
  const data = { updatedAt: now };

  if (nickName !== undefined) data.nickName = nickName;
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
  if (phoneNumber !== undefined) data.phoneNumber = phoneNumber;
  if (UNIONID) data.unionid = UNIONID;

  console.log('ensureUser called', { OPENID, hasNick: !!nickName, hasPhone: !!phoneNumber });

  try {
    await users.doc(OPENID).update({ data });
  } catch (e) {
    await users.doc(OPENID).set({ data: { role: 'visitor', createdAt: now, ...data } });
  }
  const got = await users.doc(OPENID).get();
  return { ok: true, user: got.data };
};