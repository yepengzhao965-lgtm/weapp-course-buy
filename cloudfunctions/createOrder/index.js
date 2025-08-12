const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

/**
 * 创建订单
 * event.courseId: 要购买的课程 ID
 */
exports.main = async (event, context) => {
  const { courseId } = event;
  const { OPENID } = cloud.getWXContext();
  // 获取课程价格
  const course = await db.collection('courses').doc(courseId).get();
  const price = course.data.price;
  // 构建订单号
  const outTradeNo = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const order = {
    _openid: OPENID,
    courseId: courseId,
    outTradeNo: outTradeNo,
    price: price,
    status: 'pending',
    createdAt: new Date(),
  };
  const addRes = await db.collection('orders').add({ data: order });
  return {
    orderId: addRes._id,
    outTradeNo: outTradeNo,
    price: price,
  };
};