const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

/**
 * 新增课程
 * @param {*} event
 */
exports.main = async (event, context) => {
  const { title, brief, price, cover } = event;
  if (!title) {
    return { error: 'missing title' };
  }
  const data = {
    title,
    brief,
    price,
    displayPrice: ((price || 0) / 100).toFixed(2),
    cover,
    createdAt: new Date(),
  };
  const res = await db.collection('courses').add({ data });
  return { id: res._id };
};
