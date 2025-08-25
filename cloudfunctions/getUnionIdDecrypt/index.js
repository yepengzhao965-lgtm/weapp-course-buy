const cloud = require('wx-server-sdk')
const https = require('https')
const crypto = require('crypto')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const APPID = (process.env.APPID || '').trim()
const APP_SECRET = (process.env.APP_SECRET || '').trim()

function get(url){
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch(e){ reject(e) } })
    }).on('error', reject)
  })
}

exports.main = async (event) => {
  const { code, encryptedData, iv } = event || {}
  if(!code || !encryptedData || !iv) return { ok:false, stage:'input', msg:'missing code/encryptedData/iv' }
  if(!APPID || !APP_SECRET) return { ok:false, stage:'env', msg:'APPID/APP_SECRET missing' }

  // 1) jscode2session 获取 session_key
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${APP_SECRET}&js_code=${code}&grant_type=authorization_code`
  const sess = await get(url)
  if(sess.errcode) return { ok:false, stage:'jscode2session', detail: sess }
  const sessionKey = sess.session_key

  // 2) 用 session_key 解密 encryptedData (AES-128-CBC)
  try{
    const decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(sessionKey,'base64'), Buffer.from(iv,'base64'))
    decipher.setAutoPadding(true)
    let decoded = decipher.update(encryptedData,'base64','utf8')
    decoded += decipher.final('utf8')
    const data = JSON.parse(decoded)
    return { ok:true, data, unionId: data.unionId || data.unionid || '' }
  }catch(e){
    return { ok:false, stage:'decrypt', msg: e.message || String(e) }
  }
}
