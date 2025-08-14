const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

/**
 * 查询课程列表
 * @param {*} event 
 */
exports.main = async (event, context) => {
  const page = Number(event.page) || 1;
  const pageSize = Number(event.pageSize) || 10;
  const offset = (page - 1) * pageSize;
  const res = await db.collection('courses')
    .orderBy('createdAt', 'desc')
    .skip(offset)
    .limit(pageSize)
    .get();
  return res.data;
};