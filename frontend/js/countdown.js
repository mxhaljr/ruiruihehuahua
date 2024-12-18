class CountdownManager {
    constructor() {
        if (!window.app.auth.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        this.initElements();
        this.initEventListeners();
        this.loadCountdowns();

        // 添加页面卸载时的清理
        window.addEventListener('beforeunload', () => {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }
        });
    }

    initElements() {
        this.form = document.getElementById('countdownForm');
        this.modal = document.getElementById('countdownModal');
        this.listContainer = document.getElementById('countdownList');
        this.currentId = null;
        this.allCountdowns = [];  // 缓存所有倒数日数据
    }

    initEventListeners() {
        // 分类过滤器点击事件
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.switchTab(action);
            });
        });
    }

    switchTab(action) {
        // 更新标签状态
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.action === action);
        });

        // 过滤并显示数据
        const now = new Date();
        let filteredData = this.allCountdowns;

        switch(action) {
            case 'future':
                filteredData = this.allCountdowns.filter(item => new Date(item.target_date) > now);
                break;
            case 'past':
                filteredData = this.allCountdowns.filter(item => new Date(item.target_date) <= now);
                break;
        }

        this.renderList(filteredData);
    }

    async loadCountdowns() {
        try {
            const response = await fetch(`${window.app.apiBaseUrl}/countdowns`, {
                headers: window.app.auth.getAuthHeaders()
            });

            if (!response.ok) throw new Error('获取倒数日失败');

            this.allCountdowns = await response.json();
            this.renderList(this.allCountdowns);
            this.updateCounts();
            this.startTimeUpdate();
        } catch (error) {
            console.error('加载失败:', error);
            this.showToast('加载倒数日列表失败', 'error');
        }
    }

    renderList(countdowns) {
        if (!this.listContainer) return;
        
        if (!countdowns.length) {
            this.listContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <p>暂无倒数日</p>
                    <button class="btn-add" onclick="showModal()">
                        <i class="fas fa-plus"></i>
                        添加倒数日
                    </button>
                </div>
            `;
            return;
        }

        this.listContainer.innerHTML = countdowns.map(item => this.renderCard(item)).join('');
    }

    renderCard(countdown) {
        const timeLeft = this.calculateTimeLeft(countdown.target_date);
        const cardId = `countdown-${countdown.id}`;
        const isPast = timeLeft.total < 0;

        return `
            <div class="countdown-card ${isPast ? 'past' : ''}" id="${cardId}">
                <div class="countdown-header">
                    <h3 class="countdown-title">${countdown.title}</h3>
                    <div class="countdown-actions">
                        <button onclick="countdownManager.edit(${countdown.id})" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="countdownManager.delete(${countdown.id})" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="countdown-time" data-target="${countdown.target_date}">
                    ${this.formatTimeLeft(timeLeft)}
                </div>
                <div class="countdown-info">
                    <p>目标日期: ${new Date(countdown.target_date).toLocaleDateString()}</p>
                    ${countdown.description ? `<p class="description">${countdown.description}</p>` : ''}
                </div>
            </div>
        `;
    }

    calculateTimeLeft(targetDate) {
        const now = new Date().getTime();
        const target = new Date(targetDate).getTime();
        const diff = target - now;

        return {
            total: diff,
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((diff % (1000 * 60)) / 1000)
        };
    }

    formatTimeLeft(timeLeft) {
        if (timeLeft.total < 0) {
            // 已过期的情况
            const absTimeLeft = {
                days: Math.abs(timeLeft.days),
                hours: Math.abs(timeLeft.hours),
                minutes: Math.abs(timeLeft.minutes),
                seconds: Math.abs(timeLeft.seconds)
            };
            return this.formatTimeString(absTimeLeft, true);
        }
        return this.formatTimeString(timeLeft, false);
    }

    formatTimeString(time, isPast) {
        let result = '';
        const prefix = isPast ? '已过去 ' : '还剩 ';

        if (time.days > 0) {
            result += `${time.days}天`;
        }
        if (time.hours > 0 || result !== '') {
            result += `${String(time.hours).padStart(2, '0')}时`;
        }
        if (time.minutes > 0 || result !== '') {
            result += `${String(time.minutes).padStart(2, '0')}分`;
        }
        result += `${String(time.seconds).padStart(2, '0')}秒`;

        return prefix + result;
    }

    updateCounts() {
        const now = new Date();
        const total = this.allCountdowns.length;
        const future = this.allCountdowns.filter(c => new Date(c.target_date) > now).length;
        const past = total - future;

        document.getElementById('totalCount').textContent = total;
        document.getElementById('futureCount').textContent = future;
        document.getElementById('pastCount').textContent = past;
    }

    showModal(id = null) {
        // 设置当前编辑的ID
        this.currentId = id;
        this.modal.style.display = 'block';
        document.getElementById('modalTitle').textContent = 
            id ? '编辑倒数日' : '添加倒数日';
        
        // 如果是添加新的倒数日，清空表单
        if (!id) {
            document.getElementById('title').value = '';
            document.getElementById('targetDate').value = '';
            document.getElementById('description').value = '';
        }
    }

    hideModal() {
        this.modal.style.display = 'none';
        this.form.reset();
        // 清除当前编辑的ID
        this.currentId = null;
    }

    async saveCountdown() {
        const formData = {
            title: document.getElementById('title').value.trim(),
            target_date: document.getElementById('targetDate').value,
            description: document.getElementById('description').value.trim()
        };

        if (!formData.title || !formData.target_date) {
            this.showToast('请填写标题和目标日期', 'error');
            return;
        }

        try {
            // 如果是编辑现有倒数日
            if (this.currentId !== null && this.currentId !== undefined) {
                // 先在前端更新数据
                const index = this.allCountdowns.findIndex(item => item.id === this.currentId);
                if (index !== -1) {
                    // 更新本地数据，保留原有数据的其他字段
                    const originalData = this.allCountdowns[index];
                    
                    // 后台更新
                    try {
                        const response = await fetch(`${window.app.apiBaseUrl}/countdowns/${this.currentId}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                ...window.app.auth.getAuthHeaders()
                            },
                            body: JSON.stringify(formData)
                        });

                        if (!response.ok) {
                            throw new Error('更新失败');
                        }

                        // 获取后端返回的更新后的数据
                        const updatedData = await response.json();
                        
                        // 使用后端返回的数据更新本地数据
                        this.allCountdowns[index] = {
                            ...originalData,
                            ...updatedData
                        };
                        
                        // 立即更新界面显示
                        this.renderList(this.allCountdowns);
                        
                        // 保持当前标签状态
                        const activeTab = document.querySelector('.filter-tab.active');
                        if (activeTab) {
                            this.switchTab(activeTab.dataset.action);
                        }
                        
                        // 显示成功提示
                        this.showToast('修改成功');
                        this.hideModal();
                    } catch (error) {
                        console.error('后台同步失败:', error);
                        this.showToast('保存失败，请重试', 'error');
                        // 如果后端更新失败，回滚本地数据
                        this.allCountdowns[index] = originalData;
                        this.renderList(this.allCountdowns);
                    }
                } else {
                    throw new Error('找不到要编辑的倒数日');
                }
            } else {
                // 如果是新增倒数日，仍然需要先调用API获取ID
                const response = await fetch(`${window.app.apiBaseUrl}/countdowns`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...window.app.auth.getAuthHeaders()
                    },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) throw new Error('保存失败');

                const newCountdown = await response.json();
                this.allCountdowns.push(newCountdown);
                this.renderList(this.allCountdowns);
                
                // 保持当前标签状态
                const activeTab = document.querySelector('.filter-tab.active');
                if (activeTab) {
                    this.switchTab(activeTab.dataset.action);
                }

                this.showToast('添加成功');
                this.hideModal();
            }
        } catch (error) {
            console.error('保存失败:', error);
            this.showToast('保存失���，请重试', 'error');
        }
    }

    async delete(id) {
        // 使用自定义确认框
        if (!await this.showConfirm('确定要删除这个倒数日吗？')) {
            return;
        }

        try {
            const response = await fetch(`${window.app.apiBaseUrl}/countdowns/${id}`, {
                method: 'DELETE',
                headers: window.app.auth.getAuthHeaders()
            });

            if (!response.ok) throw new Error('删除失败');

            this.showToast('删除成功');
            this.loadCountdowns();
        } catch (error) {
            console.error('删除失败:', error);
            this.showToast('删除失败，请重试', 'error');
        }
    }

    async edit(id) {
        try {
            // 从缓存中查找倒数日数据
            const countdown = this.allCountdowns.find(item => item.id === id);
            if (!countdown) {
                throw new Error('倒数日不存在');
            }

            // 填充表单数据
            document.getElementById('title').value = countdown.title;
            document.getElementById('targetDate').value = countdown.target_date.split('T')[0];
            document.getElementById('description').value = countdown.description || '';

            // 显示模态框并设置当前编辑的ID
            this.showModal(id);
        } catch (error) {
            console.error('编辑失败:', error);
            this.showToast('获取数据失败', 'error');
        }
    }

    // 添加提示框方法
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // 动画显示
        setTimeout(() => toast.classList.add('show'), 10);

        // 3秒后消失
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
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

    // 添加实时更新方法
    startTimeUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            document.querySelectorAll('.countdown-time').forEach(timeElement => {
                const targetDate = timeElement.dataset.target;
                const timeLeft = this.calculateTimeLeft(targetDate);
                timeElement.textContent = this.formatTimeLeft(timeLeft);
            });
        }, 1000);
    }
}

// 初始化
const countdownManager = new CountdownManager();

// 全局函数
window.showModal = () => countdownManager.showModal();
window.hideModal = () => countdownManager.hideModal();
window.saveCountdown = () => countdownManager.saveCountdown();