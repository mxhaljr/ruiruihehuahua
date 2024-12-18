class BirthdayManager {
    constructor() {
        this.form = document.getElementById('birthdayForm');
        this.listContainer = document.getElementById('birthdayList');
        this.modal = document.getElementById('birthdayModal');
        this.saveButton = document.getElementById('saveButton');
        this.currentEditId = null;
        this.allBirthdays = [];  // 初始化数组
        
        // 检查用户是否已登录
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        this.initEventListeners();
        this.loadBirthdays();
        
        // 添加移动端触摸支持
        this.initTouchEvents();

        // 初始化返回顶部功能
        this.initBackToTop();
    }

    initEventListeners() {
        // 确保saveButton存在
        if (this.saveButton) {
            this.saveButton.addEventListener('click', () => {
                this.handleSave();
            });
        }

        // 关闭模态框时重置表单
        this.modal.addEventListener('close', () => {
            this.form.reset();
            this.currentEditId = null;
            document.getElementById('modalTitle').textContent = '添加生日';
        });
    }

    showModal() {
        this.modal.showModal();
    }

    closeModal() {
        this.modal.close();
    }

    async loadBirthdays() {
        try {
            const response = await fetch(`${window.app.apiBaseUrl}/birthdays`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('获取生日列表失败');
            }
            
            this.allBirthdays = await response.json();  // 保存数据到实例属性
            
            if (this.allBirthdays.length === 0) {
                // 使用新的卡片样式显示空状态
                this.listContainer.innerHTML = `
                    <div class="birthday-card">
                        <div class="card-body text-center">
                            <div class="empty-state">
                                <span class="empty-icon">🎂</span>
                                <h3>还没有添加任何生日</h3>
                                <p>点击右上角的"添加生日"开始添加吧！</p>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                this.renderBirthdayList(this.allBirthdays);
            }
            
            this.updateCounts(this.allBirthdays);
            return this.allBirthdays;
        } catch (error) {
            console.error('加载生日列表失败:', error);
            this.listContainer.innerHTML = `
                <div class="birthday-card">
                    <div class="card-body text-center">
                        <div class="error-state">
                            <span class="error-icon">❌</span>
                            <h3>加载失败</h3>
                            <p>${error.message}</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    renderBirthdayList(birthdays) {
        // 检测是否为移动端
        const isMobile = window.innerWidth <= 768;
        
        this.listContainer.innerHTML = birthdays.map(birthday => `
            <div class="birthday-card">
                <div class="card-header">
                    <div class="avatar-circle ${this.getRandomColor()}">
                        ${this.decrypt(birthday.name).charAt(0)}
                    </div>
                    <div class="card-info">
                        <h3>${this.decrypt(birthday.name)}</h3>
                        <div class="date-info">
                            ${new Date(birthday.birth_date).toLocaleDateString()}
                            <span class="badge ${birthday.lunar ? 'lunar' : 'solar'}">
                                ${birthday.lunar ? '农历' : '阳历'}
                            </span>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="action-btn" onclick="birthdayManager.editBirthday(${birthday.id})">
                            ${isMobile ? '编辑' : '✏️'}
                        </button>
                        <button class="action-btn" onclick="birthdayManager.deleteBirthday(${birthday.id})">
                            ${isMobile ? '删除' : '🗑️'}
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="reminder-info">
                        <span class="reminder-badge">
                            ${this.getReminderText(birthday.reminder_days)}
                        </span>
                    </div>
                    ${birthday.description ? `
                        <div class="description">
                            ${this.decrypt(birthday.description)}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    getRandomColor() {
        const colors = [
            'bg-primary',
            'bg-success',
            'bg-info',
            'bg-warning',
            'bg-danger',
            'bg-purple',
            'bg-pink'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    getReminderText(days) {
        switch(parseInt(days)) {
            case 0:
                return '天提醒';
            case 1:
                return '提前1天';
            case 2:
                return '提前2天';
            case 3:
                return '提前3天';
            default:
                return '当天提醒';
        }
    }

    // 加密函数
    encrypt(text) {
        // 将文本转换为Base64，然后进行字符替
        const base64 = btoa(unescape(encodeURIComponent(text)));
        return base64.split('').map(char => {
            // 自定义字符映射表
            const mapping = {
                'A': 'P', 'B': 'Q', 'C': 'R', 'D': 'S', 'E': 'T',
                'F': 'U', 'G': 'V', 'H': 'W', 'I': 'X', 'J': 'Y',
                'K': 'Z', 'L': 'A', 'M': 'B', 'N': 'C', 'O': 'D',
                'P': 'E', 'Q': 'F', 'R': 'G', 'S': 'H', 'T': 'I',
                'U': 'J', 'V': 'K', 'W': 'L', 'X': 'M', 'Y': 'N',
                'Z': 'O', 'a': 'p', 'b': 'q', 'c': 'r', 'd': 's',
                'e': 't', 'f': 'u', 'g': 'v', 'h': 'w', 'i': 'x',
                'j': 'y', 'k': 'z', 'l': 'a', 'm': 'b', 'n': 'c',
                'o': 'd', 'p': 'e', 'q': 'f', 'r': 'g', 's': 'h',
                't': 'i', 'u': 'j', 'v': 'k', 'w': 'l', 'x': 'm',
                'y': 'n', 'z': 'o', '0': '5', '1': '6', '2': '7',
                '3': '8', '4': '9', '5': '0', '6': '1', '7': '2',
                '8': '3', '9': '4', '+': '-', '/': '_', '=': '.'
            };
            return mapping[char] || char;
        }).join('');
    }

    // 解密函数
    decrypt(text) {
        if (!text) return '';
        
        // 反向字符映射表
        const reverseMapping = {
            'P': 'A', 'Q': 'B', 'R': 'C', 'S': 'D', 'T': 'E',
            'U': 'F', 'V': 'G', 'W': 'H', 'X': 'I', 'Y': 'J',
            'Z': 'K', 'A': 'L', 'B': 'M', 'C': 'N', 'D': 'O',
            'E': 'P', 'F': 'Q', 'G': 'R', 'H': 'S', 'I': 'T',
            'J': 'U', 'K': 'V', 'L': 'W', 'M': 'X', 'N': 'Y',
            'O': 'Z', 'p': 'a', 'q': 'b', 'r': 'c', 's': 'd',
            't': 'e', 'u': 'f', 'v': 'g', 'w': 'h', 'x': 'i',
            'y': 'j', 'z': 'k', 'a': 'l', 'b': 'm', 'c': 'n',
            'd': 'o', 'e': 'p', 'f': 'q', 'g': 'r', 'h': 's',
            'i': 't', 'j': 'u', 'k': 'v', 'l': 'w', 'm': 'x',
            'n': 'y', 'o': 'z', '5': '0', '6': '1', '7': '2',
            '8': '3', '9': '4', '0': '5', '1': '6', '2': '7',
            '3': '8', '4': '9', '-': '+', '_': '/', '.': '='
        };

        // 还原Base64字符串
        const base64 = text.split('').map(char => reverseMapping[char] || char).join('');
        try {
            return decodeURIComponent(escape(atob(base64)));
        } catch (e) {
            console.error('解密失败:', e);
            return text;
        }
    }

    async handleSave() {
        // 获取表单数据
        const name = document.getElementById('name').value.trim();
        const birth_date = document.getElementById('birth_date').value;
        const description = document.getElementById('description').value.trim();
        const reminder_days = parseInt(document.getElementById('reminder_days').value);
        const lunar = document.getElementById('lunar').checked ? 1 : 0;

        // 验证必填字段
        if (!name || !birth_date) {
            this.showToast('请填写必填字段', 'error');
            return;
        }

        // 加密数据
        const birthdayData = {
            name: this.encrypt(name),
            birth_date,
            description: description ? this.encrypt(description) : '',
            reminder_days,
            lunar
        };

        try {
            let response;
            if (this.currentEditId) {
                // 更新生日
                response = await fetch(`${window.app.apiBaseUrl}/birthdays/${this.currentEditId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(birthdayData)
                });
            } else {
                // 添加新生日
                response = await fetch(`${window.app.apiBaseUrl}/birthdays`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(birthdayData)
                });
            }

            if (!response.ok) {
                throw new Error('保存失败');
            }

            // 重新加载数据
            await this.loadBirthdays();
            
            // 显示成功提示
            this.showToast(this.currentEditId ? '更新成功' : '添加成功');
            
            // 关闭模态框并重置表单
            this.closeModal();
            this.form.reset();
            this.currentEditId = null;
        } catch (error) {
            console.error('保存失败:', error);
            this.showToast('保存失败，请重试', 'error');
        }
    }

    editBirthday(id) {
        // 找到要编辑的生日数据
        const birthday = this.allBirthdays.find(b => b.id === id);
        if (!birthday) {
            this.showToast('未找到生日信息', 'error');
            return;
        }

        // 解密数据并填充表单
        document.getElementById('name').value = this.decrypt(birthday.name);
        document.getElementById('birth_date').value = birthday.birth_date.split('T')[0];
        document.getElementById('lunar').checked = birthday.lunar === 1;
        document.getElementById('description').value = birthday.description ? this.decrypt(birthday.description) : '';
        document.getElementById('reminder_days').value = Math.min(Math.max(birthday.reminder_days, 0), 3);
        
        // 设置当前编辑ID并显示模态框
        this.currentEditId = id;
        document.getElementById('modalTitle').textContent = '编辑生日';
        this.showModal();
    }

    async deleteBirthday(id) {
        if (!await this.showConfirm('确定要删除这条生日信息吗？')) return;

        try {
            const response = await fetch(`${window.app.apiBaseUrl}/birthdays/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('删除失败');
            }

            // 重新加载数据
            await this.loadBirthdays();
            this.showToast('删除成功');
        } catch (error) {
            console.error('删除失败:', error);
            this.showToast('删除失败，请重试', 'error');
        }
    }

    // 显示所有生日
    showAllBirthdays() {
        this.setActiveTab('total');
        this.renderBirthdayList(this.allBirthdays);
    }

    // 显示即将到来的生日
    showUpcomingBirthdays() {
        this.setActiveTab('upcoming');
        const now = new Date();
        // 过滤未来3天内的生日
        const upcomingBirthdays = this.allBirthdays.filter(birthday => {
            const birthDate = new Date(birthday.birth_date);
            const diff = this.getDateDiff(now, birthDate);
            return diff >= 0 && diff <= 3;
        });
        this.renderBirthdayList(upcomingBirthdays);
    }

    // 显示当月生日
    showMonthBirthdays() {
        this.setActiveTab('month');
        const currentMonth = new Date().getMonth() + 1;
        // 过滤当月的生日
        const monthBirthdays = this.allBirthdays.filter(birthday => {
            const birthDate = new Date(birthday.birth_date);
            return birthDate.getMonth() + 1 === currentMonth;
        });
        this.renderBirthdayList(monthBirthdays);
    }

    // 计算日期差（天数）
    getDateDiff(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.round((date2 - date1) / oneDay);
    }

    // 设置活动标签
    setActiveTab(tab) {
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        const tabMap = {
            'total': 0,
            'upcoming': 1,
            'month': 2
        };
        document.querySelectorAll('.sidebar-item')[tabMap[tab]].classList.add('active');
    }

    // 更新计数
    updateCounts(birthdays) {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentDate = today.getDate();
        
        // 总数
        document.getElementById('totalCount').textContent = birthdays.length;
        
        // 即将到来的生日数（3天内）
        const upcomingCount = birthdays.filter(birthday => {
            const diff = this.getDateDiff(today, new Date(birthday.birth_date));
            return diff <= 3 && diff >= 0;  // 修改为3天内
        }).length;
        document.getElementById('upcomingCount').textContent = upcomingCount;
        
        // 月当天生日数
        const monthCount = birthdays.filter(birthday => {
            const birthdayDate = new Date(birthday.birth_date);
            return birthdayDate.getMonth() === currentMonth && 
                   birthdayDate.getDate() === currentDate;
        }).length;
        document.getElementById('monthCount').textContent = monthCount;
    }

    // 添加移动端触摸事件支持
    initTouchEvents() {
        let startX = 0;
        let currentX = 0;
        const sidebar = document.querySelector('.sidebar');

        sidebar.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX - sidebar.scrollLeft;
        });

        sidebar.addEventListener('touchmove', (e) => {
            if (!startX) return;
            e.preventDefault();
            currentX = e.touches[0].clientX;
            sidebar.scrollLeft = startX - currentX;
        });

        sidebar.addEventListener('touchend', () => {
            startX = currentX = 0;
        });
    }

    // 初始化返回顶部功能
    initBackToTop() {
        const backToTopBtn = document.getElementById('backToTop');
        
        // 监听滚动事件
        window.addEventListener('scroll', () => {
            if (window.scrollY > 200) {
                backToTopBtn.style.display = 'flex';
            } else {
                backToTopBtn.style.display = 'none';
            }
        });

        // 点击返回顶部
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 添加提示框方法
    showToast(message, type = 'success') {
        // 移除所有现有的toast
        document.querySelectorAll('.toast').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // 动画显示
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // 2秒后消失
        setTimeout(() => {
            toast.classList.remove('show');
            // 等待过渡动画完成后移除元素
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // 添加确认框方法
    showConfirm(message) {
        return new Promise((resolve) => {
            const confirmBox = document.createElement('div');
            confirmBox.className = 'confirm-box';
            confirmBox.innerHTML = `
                <div class="confirm-content">
                    <p>${message}</p>
                    <div class="confirm-buttons">
                        <button class="btn-cancel">取消</button>
                        <button class="btn-confirm">确定</button>
                    </div>
                </div>
            `;

            document.body.appendChild(confirmBox);
            setTimeout(() => confirmBox.classList.add('show'), 10);

            // 绑定按钮事件
            const cancelBtn = confirmBox.querySelector('.btn-cancel');
            const confirmBtn = confirmBox.querySelector('.btn-confirm');

            const cleanup = (result) => {
                confirmBox.classList.remove('show');
                setTimeout(() => confirmBox.remove(), 300);
                resolve(result);
            };

            cancelBtn.onclick = () => cleanup(false);
            confirmBtn.onclick = () => cleanup(true);
        });
    }
}

// 添加窗口大小变化监听
window.addEventListener('resize', () => {
    if (window.birthdayManager) {
        window.birthdayManager.loadBirthdays();
    }
});

// 初始化
window.birthdayManager = new BirthdayManager(); 