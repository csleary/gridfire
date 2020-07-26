const createProxyMiddleware = require('http-proxy-middleware');

module.exports = app => {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8083'
    })
  );

  // app.use(
  //   '/socket.io',
  //   createProxyMiddleware({
  //     target: 'http://localhost:8083'
  //   })
  // );
};
