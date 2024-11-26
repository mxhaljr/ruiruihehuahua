// 注册成功后
alert('注册成功！请登录');
window.location.href = `login.html?email=${encodeURIComponent(email)}`; 