document.addEventListener('DOMContentLoaded', () => {
    // 显示邮箱
    const emailElement = document.getElementById('email');
    if (emailElement) {
        emailElement.textContent = localStorage.getItem('email');
    }

    // 显示统计数字
    document.getElementById('birthdayCount').textContent = '0';
    document.getElementById('anniversaryCount').textContent = '0';
    document.getElementById('countdownCount').textContent = '0';

    // 处理修改密码
    const savePasswordBtn = document.getElementById('savePasswordBtn');
    if (savePasswordBtn) {
        savePasswordBtn.addEventListener('click', async () => {
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // 验证表单
            if (!currentPassword || !newPassword || !confirmPassword) {
                alert('请填写所有密码字段');
                return;
            }

            if (newPassword !== confirmPassword) {
                alert('新密码和确认密码不匹配');
                return;
            }

            // 禁用按钮，显示加载状态
            savePasswordBtn.disabled = true;
            savePasswordBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 保存中...';

            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('未登录');
                }

                const response = await fetch(`${app.apiBaseUrl}/auth/change-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword,
                        email: localStorage.getItem('email')
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || '修改密码失败');
                }

                // 关闭模态框
                const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
                modal.hide();

                // 清空表单
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';

                alert('密码修改成功！');

            } catch (error) {
                console.error('修改密码失败:', error);
                alert(error.message || '修改密码失败，请重试');
            } finally {
                // 恢复按钮状态
                savePasswordBtn.disabled = false;
                savePasswordBtn.textContent = '保存修改';
            }
        });
    }

    // 处理退出登录 - 修改按钮选择器
    document.querySelector('.btn-logout').addEventListener('click', () => {
        if (confirm('确定要退出登录吗？')) {
            localStorage.clear();
            window.location.href = 'login.html';
        }
    });

    // 获取并显示用户统计数据
    async function fetchUserStats() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${app.apiBaseUrl}/user/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                document.getElementById('birthdayCount').textContent = data.birthdayCount || '0';
                document.getElementById('anniversaryCount').textContent = data.anniversaryCount || '0';
                document.getElementById('countdownCount').textContent = data.countdownCount || '0';
            }
        } catch (error) {
            console.error('获取统计数据失败:', error);
        }
    }

    // 加载统计数据
    fetchUserStats();
});
 