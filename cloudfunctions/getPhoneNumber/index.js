const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  const { code } = event || {}
  try {
    const res = await cloud.openapi.phonenumber.getPhoneNumber({ code })
    return { phoneNumber: res?.phoneInfo?.phoneNumber || '' }
  } catch (err) {
    return { err }
  }
}