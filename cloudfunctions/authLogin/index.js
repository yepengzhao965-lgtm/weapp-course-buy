
const cloud = require('wx-server-sdk')
const https = require('https')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const APPID = (process.env.APPID || '').trim()
const APP_SECRET = (process.env.APP_SECRET || '').trim()

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = ''
      res.on('data', d => data += d)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(e) }
      })
    }).on('error', reject)
  })
}

exports.main = async (event) => {
  const code = event && event.code
  if (!code) return { err: 'missing code' }
  if (!APPID || !APP_SECRET) return { err: 'env APPID/APP_SECRET missing' }

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${APP_SECRET}&js_code=${code}&grant_type=authorization_code`
  const json = await get(url)
  if (json.errcode) {
    return { err: 'jscode2session fail', detail: json }
  }
  return { openid: json.openid, session_key: json.session_key, unionid: json.unionid || '' }
}
