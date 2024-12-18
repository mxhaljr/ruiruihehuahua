const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = (req, res) => {
    let target = 'http://ruiruihehuahua.w1.luyouxia.net';
    
    createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite: {
            '^/api': '/api'
        },
        secure: false
    })(req, res);
}; 