const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const admins = (process.env.ADMIN_OPENIDS || '').split(',').filter(Boolean);
  if (admins.length && !admins.includes(OPENID)) {
    console.error('Unauthorized invoke', { OPENID });
    return { code: -1 };
  }
  const { openid, role } = event || {};
  if (!openid || !role) {
    return { code: -1, message: 'missing params' };
  }
  try {
    await db.collection('users').doc(openid).update({ data: { role } });
    return { code: 0 };
  } catch (e) {
    console.error('updateUserRole error:', e);
    return { code: -1, message: 'update role failed' };
  }
};