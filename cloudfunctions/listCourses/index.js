const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

/**
 * 查询课程列表
 * @param {*} event 
 */
exports.main = async (event, context) => {
  const res = await db.collection('courses').get();
  return res.data;
};