const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

/**
 * 将订单标记为已支付
 * event.orderId: 订单 ID
 */
exports.main = async (event, context) => {
  const { orderId } = event;
  await db.collection('orders').doc(orderId).update({
    data: {
      status: 'paid',
      paidAt: new Date(),
    },
  });
  return { success: true };
};