// 使用 window.app 使其全局可用
window.app = {
    apiBaseUrl: 'http://localhost:3030/api'
}; 

// 添加请求配置
window.CONFIG = {
    fetchOptions: {
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    }
}; 