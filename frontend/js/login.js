document.addEventListener('DOMContentLoaded', () => {
    // 从 URL 参数中获取邮箱
    const urlParams = new URLSearchParams(window.location.search);
    const registeredEmail = urlParams.get('email');
    
    // 如果有邮箱参数，自动填充邮箱输入框
    const emailInput = document.getElementById('email');
    if (registeredEmail && emailInput) {
        emailInput.value = registeredEmail;
        // 自动聚焦到密码输入框
        document.getElementById('password').focus();
    }

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${window.app.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                // 保存用户信息到 localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('email', data.user.email);

                // 显示登录成功提示
                alert('登录成功！');

                // 登录成功，跳转到首页
                window.location.href = '/index.html';
            } else {
                if (data.message.includes('密码错误')) {
                    alert('密码错误，请重试');
                } else if (data.message.includes('用户不存在')) {
                    alert('用户不存在，请检查邮箱');
                } else {
                    alert(data.message || '登录失败，请重试');
                }
            }
        } catch (error) {
            console.error('登录失败:', error);
            alert('登录失败，请检查网络连接');
        }
    });
}); 