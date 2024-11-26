class CountdownManager {
    constructor() {
        // 等待DOM加载完成后再初始化
        document.addEventListener('DOMContentLoaded', () => {
            this.form = document.getElementById('countdownForm');
            this.listContainer = document.getElementById('countdownList');
            this.modal = new bootstrap.Modal(document.getElementById('countdownModal'));
            this.saveButton = document.getElementById('saveButton');
            this.currentEditId = null;
            this.updateInterval = null;
            this.initEventListeners();
            this.loadCountdowns();
        });
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

        // 添加左侧菜单的点击事件监听
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                switch(action) {
                    case 'all':
                        this.showAllCountdowns();
                        break;
                    case 'future':
                        this.showFutureCountdowns();
                        break;
                    case 'past':
                        this.showPastCountdowns();
                        break;
                }
            });
        });
    }

    async loadCountdowns() {
        try {
            const response = await fetch(`${window.app.apiBaseUrl}/countdowns`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('获取倒数日列表失败');
            
            const countdowns = await response.json();
            this.updateCounts(countdowns);
            this.renderCountdownList(countdowns);
            return countdowns;
        } catch (error) {
            console.error('加载倒数日列表失败:', error);
            alert('加载倒数日列表失败');
        }
    }

    renderCountdownList(countdowns) {
        this.listContainer.innerHTML = countdowns.map(countdown => {
            const timeLeft = this.calculateTimeLeft(countdown.target_date);
            const isPast = timeLeft.total < 0;
            
            return `
                <div class="col-12 mb-3">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body p-0">
                            <div class="d-flex align-items-center p-3 border-bottom">
                                <div class="flex-grow-1">
                                    <div class="d-flex align-items-center">
                                        <h5 class="mb-0 fw-bold">${this.decrypt(countdown.title)}</h5>
                                    </div>
                                    <small class="text-muted">
                                        目标日期：${new Date(countdown.target_date).toLocaleDateString()}
                                    </small>
                                </div>
                                <div class="countdown-number ${isPast ? 'text-danger' : 'text-success'}">
                                    ${this.formatTimeLeft(timeLeft)}
                                </div>
                                <div class="d-flex gap-2 ms-3">
                                    <button class="btn btn-icon" onclick="countdownManager.editCountdown(${countdown.id})">
                                        <i class="fas fa-edit text-primary"></i>
                                    </button>
                                    <button class="btn btn-icon" onclick="countdownManager.deleteCountdown(${countdown.id})">
                                        <i class="fas fa-trash-alt text-danger"></i>
                                    </button>
                                </div>
                            </div>
                            ${countdown.description ? `
                                <div class="px-3 py-2 bg-light">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-comment-alt me-2 text-info"></i>
                                        <span class="text-muted">${this.decrypt(countdown.description)}</span>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // 每秒更新一次倒计时显示
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.updateInterval = setInterval(() => this.updateCountdowns(), 1000);
    }

    calculateTimeLeft(targetDate) {
        const now = new Date().getTime();
        const target = new Date(targetDate).getTime();
        const difference = target - now;
        
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        return {
            total: difference,
            days,
            hours,
            minutes,
            seconds
        };
    }

    formatTimeLeft(timeLeft) {
        if (timeLeft.total < 0) {
            const pastTime = this.calculateTimeLeft(new Date());
            return `已过期 ${Math.abs(timeLeft.days)}天${Math.abs(timeLeft.hours)}时${Math.abs(timeLeft.minutes)}分${Math.abs(timeLeft.seconds)}秒`;
        }
        
        let result = '';
        if (timeLeft.days > 0) {
            result += `${timeLeft.days}天`;
        }
        result += `${timeLeft.hours}时${timeLeft.minutes}分${timeLeft.seconds}秒`;
        return result;
    }

    updateCountdowns() {
        const countdownElements = document.querySelectorAll('.countdown-number');
        countdownElements.forEach(element => {
            const targetDate = element.closest('.card').querySelector('small').textContent.split('：')[1];
            const timeLeft = this.calculateTimeLeft(targetDate);
            element.textContent = this.formatTimeLeft(timeLeft);
            element.className = `countdown-number ${timeLeft.total < 0 ? 'text-danger' : 'text-success'}`;
        });
    }

    // 在组件销毁时清除定时器
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }

    // 加密函数
    encrypt(text) {
        const base64 = btoa(unescape(encodeURIComponent(text)));
        return base64.split('').map(char => {
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

        const base64 = text.split('').map(char => reverseMapping[char] || char).join('');
        try {
            return decodeURIComponent(escape(atob(base64)));
        } catch (e) {
            console.error('解密失败:', e);
            return text;
        }
    }

    async handleSave() {
        const title = document.getElementById('title').value.trim();
        const target_date = document.getElementById('target_date').value;
        const description = document.getElementById('description').value.trim();

        if (!title || !target_date) {
            alert('请填写必填字段');
            return;
        }

        const countdownData = {
            title: this.encrypt(title),
            target_date,
            description: description ? this.encrypt(description) : ''
        };

        try {
            if (this.currentEditId) {
                await this.updateCountdown(this.currentEditId, countdownData);
            } else {
                await this.createCountdown(countdownData);
            }
            
            this.modal.hide();
            this.form.reset();
            this.currentEditId = null;
            await this.loadCountdowns();
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败');
        }
    }

    async createCountdown(countdownData) {
        const response = await fetch(`${window.app.apiBaseUrl}/countdowns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(countdownData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '添加倒数日失败');
        }
        alert('添加成功！');
    }

    async deleteCountdown(id) {
        if (!confirm('确定要删除这条倒数日信息吗？')) return;

        try {
            const response = await fetch(`${window.app.apiBaseUrl}/countdowns/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('删除失败');
            
            this.loadCountdowns();
            alert('删除成功！');
        } catch (error) {
            console.error('删除失败:', error);
            alert('删除失败');
        }
    }

    async editCountdown(id) {
        try {
            const response = await fetch(`${window.app.apiBaseUrl}/countdowns/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('获取倒数日信息失败');
            
            const countdown = await response.json();
            
            document.getElementById('title').value = this.decrypt(countdown.title);
            document.getElementById('target_date').value = countdown.target_date.split('T')[0];
            document.getElementById('description').value = countdown.description ? this.decrypt(countdown.description) : '';
            
            this.currentEditId = id;
            document.getElementById('modalTitle').textContent = '编辑倒数日';
            this.modal.show();
        } catch (error) {
            console.error('编辑失败:', error);
            alert('获取倒数日信息失败');
        }
    }

    async updateCountdown(id, countdownData) {
        const response = await fetch(`${window.app.apiBaseUrl}/countdowns/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(countdownData)
        });

        if (!response.ok) throw new Error('更新失败');
        alert('更新成功！');
    }

    async showAllCountdowns() {
        console.log('显示所有倒数日');  // 添加日志
        this.setActiveTab('all');
        try {
            const response = await fetch(`${window.app.apiBaseUrl}/countdowns`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('获取所有倒数日失败');
            
            const countdowns = await response.json();
            console.log('获取到的倒数日:', countdowns);  // 添加日志
            this.updateCounts(countdowns);
            this.renderCountdownList(countdowns);
        } catch (error) {
            console.error('加载所有倒数日失败:', error);
        }
    }

    async showFutureCountdowns() {
        console.log('显示未来倒数日');
        this.setActiveTab('future');
        try {
            const response = await fetch(`${window.app.apiBaseUrl}/countdowns/future`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('获取未来倒数日失败');
            
            const countdowns = await response.json();
            console.log('获取到的未来倒数日:', countdowns);
            
            // 再次验证日期
            const today = new Date();
            const futureCountdowns = countdowns.filter(countdown => {
                const targetDate = new Date(countdown.target_date);
                return targetDate > today;
            });
            
            this.renderCountdownList(futureCountdowns);
        } catch (error) {
            console.error('加载未来倒数日失败:', error);
        }
    }

    async showPastCountdowns() {
        console.log('显示已过期倒数日');
        this.setActiveTab('past');
        try {
            const response = await fetch(`${window.app.apiBaseUrl}/countdowns/past`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('获取已过期倒数日失败');
            
            const countdowns = await response.json();
            console.log('获取到的已过期倒数日:', countdowns);
            
            // 再次验证日期
            const today = new Date();
            const pastCountdowns = countdowns.filter(countdown => {
                const targetDate = new Date(countdown.target_date);
                return targetDate <= today;
            });
            
            this.renderCountdownList(pastCountdowns);
        } catch (error) {
            console.error('加载已过期倒数日失败:', error);
        }
    }

    setActiveTab(tab) {
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        const tabMap = {
            'all': 0,
            'future': 1,
            'past': 2
        };
        document.querySelectorAll('.sidebar-item')[tabMap[tab]].classList.add('active');
    }

    updateCounts(countdowns) {
        const today = new Date();
        
        // 总数
        document.getElementById('totalCount').textContent = countdowns.length;
        
        // 未来倒数
        const futureCount = countdowns.filter(countdown => {
            return new Date(countdown.target_date) > today;
        }).length;
        document.getElementById('futureCount').textContent = futureCount;
        
        // 已过期
        const pastCount = countdowns.filter(countdown => {
            return new Date(countdown.target_date) <= today;
        }).length;
        document.getElementById('pastCount').textContent = pastCount;
    }
}

// 修改初始化方式
const countdownManager = new CountdownManager(); 