const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

/**
 * 用于初始化数据库示例数据
 * 创建两门课程和一些课时
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
  const courses = [
    {
      title: '小程序入门课程',
      brief: '学习微信小程序开发的基础知识',
      price: 19900,
      createdAt: new Date(),
    },
    {
      title: '高级小程序课程',
      brief: '深入掌握云开发与高级技巧',
      price: 29900,
      createdAt: new Date(),
    },
  ];
  for (const c of courses) {
    // 查询是否已存在同名课程，避免重复插入
    const existCourse = await db.collection('courses').where({ title: c.title }).get();
    let courseId;
    if (existCourse.data.length > 0) {
      courseId = existCourse.data[0]._id;
    } else {
      const addRes = await db.collection('courses').add({ data: c });
      courseId = addRes._id;
    }
    // 创建 3 节课，同时检查是否已存在
    for (let i = 1; i <= 3; i++) {
      const lessonTitle = `${c.title} 第${i}节`;
      const existLesson = await db
        .collection('lessons')
        .where({ courseId, title: lessonTitle })
        .get();
      if (existLesson.data.length === 0) {
        await db.collection('lessons').add({
          data: {
            courseId,
            title: lessonTitle,
            order: i,
            duration: 600,
            // 上传视频后将 videoFileId 更新为云存储fileID
            videoFileId: '',
            createdAt: new Date(),
          },
        });
      }
    }
  }
  return { success: true };
};