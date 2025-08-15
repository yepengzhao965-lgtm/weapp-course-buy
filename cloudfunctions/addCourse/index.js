const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

/**
 * 新增课程
 * @param {*} event
 */
exports.main = async (event, context) => {
  const { OPENID, CLIENTIP } = cloud.getWXContext();
  const admins = (process.env.ADMIN_OPENIDS || '').split(',').filter(Boolean);
  const allowedIps = (process.env.ALLOWED_IPS || '').split(',').filter(Boolean);
  if ((allowedIps.length && !allowedIps.includes(CLIENTIP)) ||
      (admins.length && !admins.includes(OPENID))) {
    console.error('Unauthorized invoke', { OPENID, CLIENTIP });
    return { code: -1 };
  }
  const { title, brief, price, cover } = event;
  if (!title) {
    return { error: 'missing title' };
  }
  const numPrice = Number(price);
  if (!Number.isFinite(numPrice) || numPrice < 0) {
    return { error: 'invalid price' };
  }
  try {
    // 查询是否已存在同名课程，避免重复添加
    const exist = await db.collection('courses').where({ title }).get();
    if (exist.data.length > 0) {
      return { error: 'duplicate title', id: exist.data[0]._id };
    }
    const data = {
      title,
      brief,
      price: numPrice,
      displayPrice: ((numPrice || 0) / 100).toFixed(2),
      cover,
      createdAt: new Date(),
    };
    const res = await db.collection('courses').add({ data });
    return { id: res._id };
  } catch (e) {
    console.error('addCourse error:', e);
    return { code: -1, message: 'add course failed' };
  }
};