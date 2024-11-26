// 创建导航栏 HTML
const navHTML = `
<nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <div class="container">
        <a class="navbar-brand" href="index.html">生日提醒网站</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto">
                <li class="nav-item">
                    <a class="nav-link" href="index.html">
                        <i class="fas fa-home"></i> 首页
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="birthday.html">
                        <i class="fas fa-birthday-cake"></i> 生日
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="anniversary.html">
                        <i class="fas fa-heart"></i> 纪念日
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="countdown.html">
                        <i class="fas fa-hourglass-half"></i> 倒数日
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="profile.html">
                        <i class="fas fa-user"></i> 我的
                    </a>
                </li>
            </ul>
        </div>
    </div>
</nav>
`;

// 直接插入导航栏
document.getElementById('nav-placeholder').innerHTML = navHTML;

// 设置当前页面的导航项为激活状态
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
const currentNavLink = document.querySelector(`.nav-link[href="${currentPage}"]`);
if (currentNavLink) {
    currentNavLink.classList.add('active');
} 