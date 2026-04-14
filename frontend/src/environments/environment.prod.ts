declare const window: any;

const runtimeConfig = window.__APP_CONFIG__ || {};

export const environment = {
  production: true,
  apiUrl: runtimeConfig.apiUrl || '/api',
  siteUrl: runtimeConfig.siteUrl || 'https://diasfragrance.com',
  defaultOgImage: '/assets/images/logo.png'
};

