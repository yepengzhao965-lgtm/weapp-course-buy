const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

/**
 * 用于初始化数据库示例数据
 * 创建两门课程和一些课时
 */
exports.main = async (event, context) => {
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
    const addRes = await db.collection('courses').add({ data: c });
    const courseId = addRes._id;
    // 创建 3 节课
    for (let i = 1; i <= 3; i++) {
      await db.collection('lessons').add({
        data: {
          courseId: courseId,
          title: `${c.title} 第${i}节`,
          order: i,
          duration: 600,
          // 上传视频后将 videoFileId 更新为云存储fileID
          videoFileId: '',
          createdAt: new Date(),
        },
      });
    }
  }
  return { success: true };
};