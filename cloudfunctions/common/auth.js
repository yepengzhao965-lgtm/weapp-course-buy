function isAuthorized(OPENID, CLIENTIP) {
  const admins = (process.env.ADMIN_OPENIDS || '').split(',').filter(Boolean);
  const allowedIps = (process.env.ALLOWED_IPS || '').split(',').filter(Boolean);
  if ((allowedIps.length && !allowedIps.includes(CLIENTIP)) ||
      (admins.length && !admins.includes(OPENID))) {
    console.error('Unauthorized invoke', { OPENID, CLIENTIP });
    return false;
  }
  return true;
}

module.exports = { isAuthorized };