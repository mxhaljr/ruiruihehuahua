document.addEventListener('DOMContentLoaded', () => {
    const deleteForm = document.getElementById('deleteForm');
    const sendCodeBtn = document.getElementById('sendCode');
    const confirmCheckbox = document.querySelector('input[type="checkbox"]');
    const submitBtn = document.querySelector('.btn-submit');
    const emailInput = document.getElementById('email');

    const userInfo = window.app.auth.getUserInfo();
    if (userInfo && userInfo.email && emailInput) {
        emailInput.value = userInfo.email;
        emailInput.readOnly = true;
    }

    if (confirmCheckbox && submitBtn) {
        const updateSubmitButton = () => {
            submitBtn.disabled = !confirmCheckbox.checked;
            submitBtn.style.opacity = confirmCheckbox.checked ? '1' : '0.5';
        };

        confirmCheckbox.addEventListener('change', updateSubmitButton);
        updateSubmitButton();
    }

    if (sendCodeBtn) {
        let countdown = 0;
        let timer = null;

        const startCountdown = () => {
            countdown = 60;
            sendCodeBtn.disabled = true;
            timer = setInterval(() => {
                sendCodeBtn.textContent = `${countdown}秒后重试`;
                countdown--;
                if (countdown < 0) {
                    clearInterval(timer);
                    sendCodeBtn.disabled = false;
                    sendCodeBtn.textContent = '获取验证码';
                }
            }, 1000);
        };

        sendCodeBtn.addEventListener('click', async () => {
            const email = emailInput.value;
            if (!email) {
                alert('请输入邮箱地址');
                return;
            }

            try {
                sendCodeBtn.disabled = true;
                sendCodeBtn.textContent = '发送中...';

                const headers = {
                    'Content-Type': 'application/json',
                    ...window.app.auth.getAuthHeaders()
                };

                const response = await fetch(`${window.app.apiBaseUrl}/auth/send-code`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ 
                        email,
                        type: 'delete-account'
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('验证码已发送到您的邮箱，请查收');
                    startCountdown();
                } else {
                    throw new Error(data.message || '发送验证码失败');
                }
            } catch (error) {
                alert(error.message || '发送验证码失败，请重试');
                sendCodeBtn.disabled = false;
                sendCodeBtn.textContent = '获取验证码';
            }
        });
    }

    if (deleteForm) {
        deleteForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!confirmCheckbox.checked) {
                alert('请确认您已了解账号注销的所有后果');
                return;
            }

            const email = emailInput.value;
            const code = document.getElementById('code').value;

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = '注销中...';

                const headers = {
                    'Content-Type': 'application/json',
                    ...window.app.auth.getAuthHeaders()
                };

                const response = await fetch(`${window.app.apiBaseUrl}/auth/account/delete`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        email,
                        code
                    })
                });

                const responseText = await response.text();

                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (e) {
                    if (response.status === 404) {
                        throw new Error('注销接口不存在，请联系管理员');
                    } else {
                        throw new Error('服务器响应格式错误');
                    }
                }

                if (response.ok) {
                    alert('账号已成功注销');
                    window.app.auth.clear();
                    window.location.href = 'register.html';
                } else {
                    throw new Error(data.message || '注销失败');
                }
            } catch (error) {
                alert(error.message || '注销失败，请重试');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = '确认注销';
            }
        });
    }
}); 