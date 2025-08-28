const cloud = require('wx-server-sdk');
const { isAuthorized } = require('../common');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID, CLIENTIP } = cloud.getWXContext();
  const admins = (process.env.ADMIN_OPENIDS || '').split(',').filter(Boolean);
  if (admins.length === 0) {
    console.error('ADMIN_OPENIDS not configured');
    return { code: -1, message: 'admin not configured' };
  }
  if (!isAuthorized(OPENID, CLIENTIP)) {
    return { code: -1 };
  }
  const { openid, role } = event || {};
  if (!openid || !role) {
    console.error('missing params', { openid, role });
    return { code: -1, message: 'missing params' };
  }
  try {
    await db.collection('users').doc(openid).update({ data: { role } });
    console.info('updateUserRole success', { operator: OPENID, openid, role });
    return { code: 0 };
  } catch (e) {
    console.error('updateUserRole error:', e);
    return { code: -1, message: 'update role failed' };
  }
};