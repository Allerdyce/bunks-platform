// Offline stand-in for Google Fonts CSS so `next build` can run in the sandbox.
const css = (family) => `@font-face { font-family: '${family}'; font-style: normal; font-weight: 400; font-display: swap; src: url(https://fonts.gstatic.com/s/mock/v1/mock.woff2) format('woff2'); unicode-range: U+0000-00FF; }`;
module.exports = new Proxy({}, { get: (_, url) => { const m = /family=([^:&]+)/.exec(String(url)); return css(m ? decodeURIComponent(m[1]).replace(/\+/g, " ") : "Mock"); } });
