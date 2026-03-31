function getCookieBaseOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite = process.env.AUTH_COOKIE_SAME_SITE || 'lax';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
}

function setAuthCookie(res, token) {
  res.cookie('auth_token', token, getCookieBaseOptions());
}

function clearAuthCookie(res) {
  res.clearCookie('auth_token', {
    ...getCookieBaseOptions(),
    maxAge: undefined
  });
}

module.exports = {
  setAuthCookie,
  clearAuthCookie
};
