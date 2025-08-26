const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const orders = db.collection('orders')      // 如果你的集合叫 'order'，把这里改掉
const courses = db.collection('courses')    // 课程集合（若你的项目名字不同可调整）

function rid(len){ const chars='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'; let s=''; for(let i=0;i<len;i++){ s+=chars[Math.floor(Math.random()*chars.length)] } return s }
function makeTradeNo(){ const d = new Date(); const ymd = [d.getFullYear(), ('0'+(d.getMonth()+1)).slice(-2), ('0'+d.getDate()).slice(-2)].join(''); const hms = [ ('0'+d.getHours()).slice(-2), ('0'+d.getMinutes()).slice(-2), ('0'+d.getSeconds()).slice(-2) ].join(''); return 'OD'+ymd+hms+rid(6) }

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const action = event && event.action ? event.action : ''

  if (action === 'create') {
    const courseId = event.courseId
    if (!courseId) return { err: 'missing courseId' }
    // 获取课程
    const cr = await courses.doc(courseId).get().catch(()=>null)
    const course = cr && cr.data ? cr.data : null
    if (!course) return { err: 'course not found' }

    // 如果已有未支付/已支付订单，直接返回
    const existed = await orders.where({ openid: OPENID, courseId }).orderBy('createdAt','desc').get()
    if (existed.data && existed.data.length) {
      const last = existed.data[0]
      return { order: last }
    }

    const outTradeNo = makeTradeNo()
    const order = {
      outTradeNo,
      openid: OPENID,
      courseId,
      title: course.title || course.name || '课程',
      cover: course.cover || course.image || '',
      amount: Number(course.price || 0),
      status: 'CREATED',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    const add = await orders.add({ data: order })
    const saved = await orders.doc(add._id).get()
    return { order: saved.data }
  }

  if (action === 'query') {
    const outTradeNo = event.outTradeNo
    if (!outTradeNo) return { err: 'missing outTradeNo' }
    const r = await orders.where({ openid: OPENID, outTradeNo }).get()
    if (!r.data.length) return { err: 'not found' }
    return { order: r.data[0] }
  }

  if (action === 'mine') {
    const r = await orders.where({ openid: OPENID, status: 'PAID' }).orderBy('paidAt','desc').get()
    return { list: r.data }
  }

  return { err: 'unknown action' }
}
