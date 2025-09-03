import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const { WECHAT_APPID, WECHAT_SECRET, PORT = 3000 } = process.env;

let cachedToken = null;
let tokenExpireAt = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpireAt - 60 * 1000) return cachedToken;
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}`;
  const resp = await fetch(url);
  const data = await resp.json();
  if (!data.access_token) throw new Error('get access_token failed: ' + JSON.stringify(data));
  cachedToken = data.access_token;
  tokenExpireAt = now + (data.expires_in || 7200) * 1000;
  return cachedToken;
}

// 新版：一次性 code
app.post('/wechat/phone', async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: 'missing code' });

    const token = await getAccessToken();
    const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${token}`;
    const wxResp = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code })
    });
    const wxData = await wxResp.json();
    if (wxData.errcode === 0 && wxData.phone_info?.phoneNumber) {
      return res.json({ phoneNumber: wxData.phone_info.phoneNumber, raw: wxData });
    }
    return res.status(400).json({ error: 'wechat api error', detail: wxData });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 旧版兼容：encryptedData + iv
app.post('/wechat/phone-legacy', async (req, res) => {
  try {
    const { loginCode, encryptedData, iv } = req.body || {};
    if (!loginCode || !encryptedData || !iv) return res.status(400).json({ error: 'missing param' });

    // 先用 jscode2session 拿 session_key
    const sessUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}&js_code=${encodeURIComponent(loginCode)}&grant_type=authorization_code`;
    const sessResp = await fetch(sessUrl);
    const sessData = await sessResp.json();
    if (!sessData.session_key) {
      return res.status(400).json({ error: 'jscode2session failed', detail: sessData });
    }

    // 解密
    const sessionKeyBuf = Buffer.from(sessData.session_key, 'base64');
    const encryptedBuf = Buffer.from(encryptedData, 'base64');
    const ivBuf = Buffer.from(iv, 'base64');
    const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKeyBuf, ivBuf);
    decipher.setAutoPadding(true);
    let decoded = decipher.update(encryptedBuf, undefined, 'utf8');
    decoded += decipher.final('utf8');
    const phoneInfo = JSON.parse(decoded);

    // 安全性校验可选：watermark.appid === WECHAT_APPID

    if (phoneInfo?.phoneNumber) {
      return res.json({ phoneNumber: phoneInfo.phoneNumber, raw: phoneInfo });
    }
    return res.status(400).json({ error: 'decrypt fail', detail: phoneInfo });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/health', (req, res) => res.send('ok'));
app.listen(PORT, () => console.log(`server listening on :${PORT}`));
