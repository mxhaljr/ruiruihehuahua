class BirthdayManager {
    constructor() {
        // 移除构造函数中的DOMContentLoaded事件监听
        this.form = document.getElementById('birthdayForm');
        this.listContainer = document.getElementById('birthdayList');
        this.modal = new bootstrap.Modal(document.getElementById('birthdayModal'));
        this.saveButton = document.getElementById('saveButton');
        this.currentEditId = null;
        this.initEventListeners();
        this.loadBirthdays();
    }

    initEventListeners() {
        // 确保saveButton存在
        if (this.saveButton) {
            this.saveButton.addEventListener('click', () => {
                console.log('保存按钮被点击'); // 添加日志
                this.handleSave();
            });
        } else {
            console.error('保存按钮未找到');
        }
    }

    async loadBirthdays() {
        try {
            const response = await fetch(`${window.app.apiBaseUrl}/birthdays`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('获取生日列表失败');
            
            const birthdays = await response.json();
            this.updateCounts(birthdays);
            this.renderBirthdayList(birthdays);
            return birthdays;
        } catch (error) {
            console.error('加载生日列表失败:', error);
            alert('加载生日列表失败');
        }
    }

    renderBirthdayList(birthdays) {
        this.listContainer.innerHTML = birthdays.map(birthday => `
            <div class="col-12 mb-3">
                <div class="card h-100 border-0 shadow-sm">
                    <div class="card-body p-0">
                        <div class="d-flex align-items-center p-3 border-bottom">
                            <div class="avatar-circle me-3 ${this.getRandomColor()}" style="
                                width: 48px;
                                height: 48px;
                                font-size: 1.5rem;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                border-radius: 50%;
                                color: white;
                                font-weight: 600;
                            ">
                                ${this.decrypt(birthday.name).charAt(0)}
                            </div>
                            <div class="flex-grow-1">
                                <h5 class="mb-0 fw-bold">${this.decrypt(birthday.name)}</h5>
                                <small class="text-muted">
                                    ${new Date(birthday.birth_date).toLocaleDateString()}
                                    <span class="badge ms-2 ${birthday.lunar ? 'bg-warning' : 'bg-info'}">
                                        ${birthday.lunar ? '农历' : '阳历'}
                                    </span>
                                </small>
                            </div>
                            <div class="d-flex gap-2">
                                <button class="btn btn-icon" onclick="birthdayManager.editBirthday(${birthday.id})">
                                    <i class="fas fa-edit text-primary"></i>
                                </button>
                                <button class="btn btn-icon" onclick="birthdayManager.deleteBirthday(${birthday.id})">
                                    <i class="fas fa-trash-alt text-danger"></i>
                                </button>
                            </div>
                        </div>
                        <div class="px-3 py-2 bg-light">
                            <div class="row g-2">
                                <div class="col-auto">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-bell me-2 text-warning"></i>
                                        <span class="badge bg-light text-dark border">
                                            ${this.getReminderText(birthday.reminder_days)}
                                        </span>
                                    </div>
                                </div>
                                ${birthday.description ? `
                                    <div class="col">
                                        <div class="d-flex align-items-center">
                                            <i class="fas fa-comment-alt me-2 text-info"></i>
                                            <span class="text-muted">${this.decrypt(birthday.description)}</span>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
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
                return '当天提醒';
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
        // 将文本转换为Base64，然后进行字符替换
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
        console.log('handleSave被调用'); // 添加日志
        // 获取表单数据
        const name = document.getElementById('name').value.trim();
        const birth_date = document.getElementById('birth_date').value;
        const description = document.getElementById('description').value.trim();
        const reminder_days = parseInt(document.getElementById('reminder_days').value);
        const lunar = document.getElementById('lunar').checked ? 1 : 0;

        // 验证必填字段
        if (!name || !birth_date) {
            alert('请填写必填字段');
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
            if (this.currentEditId) {
                await this.updateBirthday(this.currentEditId, birthdayData);
            } else {
                await this.createBirthday(birthdayData);
            }
            
            this.modal.hide();
            this.form.reset();
            this.currentEditId = null;
            await this.loadBirthdays();
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败');
        }
    }

    async createBirthday(birthdayData) {
        console.log('发送到后端的数据:', birthdayData);  // 添加日志
        const response = await fetch(`${window.app.apiBaseUrl}/birthdays`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(birthdayData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '添加生日失败');
        }
        alert('添加成功！');
    }

    async deleteBirthday(id) {
        if (!confirm('确定要删除这条生日信息吗？')) return;

        try {
            const response = await fetch(`${window.app.apiBaseUrl}/birthdays/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('删除失败');
            
            this.loadBirthdays();
            alert('删除成功！');
        } catch (error) {
            console.error('删除失败:', error);
            alert('删除失败');
        }
    }

    async editBirthday(id) {
        try {
            const response = await fetch(`${window.app.apiBaseUrl}/birthdays/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('获取生日信息失败');
            
            const birthday = await response.json();
            
            // 解密数据后填充表单
            document.getElementById('name').value = this.decrypt(birthday.name);
            document.getElementById('birth_date').value = birthday.birth_date.split('T')[0];
            document.getElementById('lunar').checked = birthday.lunar === 1;
            document.getElementById('description').value = birthday.description ? this.decrypt(birthday.description) : '';
            document.getElementById('reminder_days').value = Math.min(Math.max(birthday.reminder_days, 0), 3);
            
            this.currentEditId = id;
            document.getElementById('modalTitle').textContent = '编辑生日';
            this.modal.show();
        } catch (error) {
            console.error('编辑失败:', error);
            alert('获取生日信息失败');
        }
    }

    async updateBirthday(id, birthdayData) {
        const response = await fetch(`${window.app.apiBaseUrl}/birthdays/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(birthdayData)
        });

        if (!response.ok) throw new Error('更新失败');
        alert('更新成功！');
    }

    // 显示所有生日
    async showAllBirthdays() {
        this.setActiveTab('total');
        await this.loadBirthdays();
    }

    // 显示即将到来的生日
    async showUpcomingBirthdays() {
        this.setActiveTab('upcoming');
        try {
            const birthdays = await this.loadBirthdays();
            const upcomingBirthdays = birthdays.filter(birthday => {
                const birthdayDate = new Date(birthday.birth_date);
                const today = new Date();
                const diff = this.getDateDiff(today, birthdayDate);
                return diff <= 3 && diff >= 0;
            });
            
            if (upcomingBirthdays.length === 0) {
                this.listContainer.innerHTML = `
                    <div class="col-12">
                        <div class="card h-100 border-0 shadow-sm">
                            <div class="card-body text-center p-5">
                                <i class="fas fa-birthday-cake text-muted mb-3" style="font-size: 3rem;"></i>
                                <h5 class="text-muted">最近3天内没有生日哦，快去添加生日吧！</h5>
                            </div>
                        </div>
                    </div>
                `;
                return;
            }
            
            this.renderBirthdayList(upcomingBirthdays);
        } catch (error) {
            console.error('加载即将到来的生日失败:', error);
        }
    }

    // 显示当月生日
    async showMonthBirthdays() {
        this.setActiveTab('month');
        try {
            const birthdays = await this.loadBirthdays();
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentDate = today.getDate();
            
            const monthBirthdays = birthdays.filter(birthday => {
                const birthdayDate = new Date(birthday.birth_date);
                return birthdayDate.getMonth() === currentMonth && 
                       birthdayDate.getDate() === currentDate;
            });
            
            if (monthBirthdays.length === 0) {
                this.listContainer.innerHTML = `
                    <div class="col-12">
                        <div class="card h-100 border-0 shadow-sm">
                            <div class="card-body text-center p-5">
                                <i class="fas fa-calendar-alt text-muted mb-3" style="font-size: 3rem;"></i>
                                <h5 class="text-muted">今天没有生日哦，快去添加生日吧！</h5>
                            </div>
                        </div>
                    </div>
                `;
                return;
            }
            
            this.renderBirthdayList(monthBirthdays);
        } catch (error) {
            console.error('加载当月生日失败:', error);
        }
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
        
        // 当月当天生日数
        const monthCount = birthdays.filter(birthday => {
            const birthdayDate = new Date(birthday.birth_date);
            return birthdayDate.getMonth() === currentMonth && 
                   birthdayDate.getDate() === currentDate;
        }).length;
        document.getElementById('monthCount').textContent = monthCount;
    }

    // 计算日期差
    getDateDiff(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.round((date2 - date1) / oneDay);
    }
}

// 修改初始化方式
document.addEventListener('DOMContentLoaded', () => {
    // 确保DOM完全加载后再初始化
    setTimeout(() => {
        window.birthdayManager = new BirthdayManager();
    }, 0);
}); 