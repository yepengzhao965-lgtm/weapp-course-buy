const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

/**
 * 根据课程 ID 和课时 ID 返回可用的视频临时 URL
 * 仅当用户已购买该课程时才返回
 */
exports.main = async (event, context) => {
  const { courseId, lessonId } = event;
  const { OPENID } = cloud.getWXContext();

  // 检查订单状态
  const orderRes = await db.collection('orders')
    .where({
      _openid: OPENID,
      courseId: courseId,
      status: 'paid'
    })
    .get();
  if (!orderRes.data || orderRes.data.length === 0) {
    throw new Error('NOT_AUTHORIZED');
  }

  // 获取课时
  const lessonRes = await db.collection('lessons').doc(lessonId).get();
  const lesson = lessonRes.data;
  if (!lesson) {
    throw new Error('NO_VIDEO');
  }
  // 确认课时属于传入的课程
  if (lesson.courseId !== courseId) {
    throw new Error('NOT_AUTHORIZED');
  }
  if (!lesson.videoFileId) {
    throw new Error('NO_VIDEO');
  }
  // 获取临时视频链接
  const urlRes = await cloud.getTempFileURL({
    fileList: [lesson.videoFileId],
  });
  const urlInfo = urlRes.fileList[0];
  if (!urlInfo || urlInfo.status !== 0 || !urlInfo.tempFileURL) {
    throw new Error('FILE_FETCH_FAILED');
  }
  return {
    videoUrl: urlInfo.tempFileURL,
};
};