const cloud = require('wx-server-sdk')
const https = require('https')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const APPID = (process.env.APPID || '').trim()
const APP_SECRET = (process.env.APP_SECRET || '').trim()

function get(url){
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let d=''
      res.on('data', c => d+=c)
      res.on('end', () => { try{ resolve(JSON.parse(d)) } catch(e){ reject(e) } })
    }).on('error', reject)
  })
}

exports.main = async (event) => {
  const code = event && event.code
  if(!code) return { ok:false, stage:'input', msg:'missing code' }
  if(!APPID || !APP_SECRET) return { ok:false, stage:'env', msg:'APPID/APP_SECRET missing' }

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${APP_SECRET}&js_code=${code}&grant_type=authorization_code`
  const json = await get(url)
  if(json.errcode) return { ok:false, stage:'jscode2session', detail: json }
  return { ok:true, openid: json.openid, session_key: json.session_key, unionid: json.unionid || '' }
}
