const API_BASE_URL = window.app.apiBaseUrl;

class AnniversaryManager {
    constructor() {
        this.initPage();
        this.allData = [];
    }

    initPage() {
        document.querySelector('.btn-add').addEventListener('click', () => {
            const modal = document.createElement('dialog');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>添加纪念日</h3>
                        <button class="close-btn" onclick="this.closest('dialog').close()">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="anniversaryForm">
                            <div class="form-group">
                                <label>标题</label>
                                <input type="text" name="title" required>
                            </div>
                            <div class="form-group">
                                <label>日期</label>
                                <input type="date" name="date" required>
                            </div>
                            <div class="form-group">
                                <label>类型</label>
                                <select name="type">
                                    <option value="love">恋���纪念</option>
                                    <option value="wedding">结婚纪念</option>
                                    <option value="work">工作纪念</option>
                                    <option value="other">其他纪念</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>提醒设置</label>
                                <select name="reminder_days">
                                    <option value="0">当天提醒</option>
                                    <option value="1">提前1天</option>
                                    <option value="3">提前3天</option>
                                    <option value="7">提前7天</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>备注</label>
                                <textarea name="description" rows="3" placeholder="添加一些备注信息..."></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-cancel">取消</button>
                        <button class="btn-save">保存</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            modal.querySelector('.btn-cancel').addEventListener('click', () => modal.close());
            modal.querySelector('.btn-save').addEventListener('click', () => this.saveAnniversary());
            
            modal.showModal();
        });

        document.querySelectorAll('.sidebar-item').forEach((item, index) => {
            item.onclick = () => {
                this.setActiveTab(index);
                if (index === 0) this.loadAll();
                else if (index === 1) this.loadUpcoming();
                else if (index === 2) this.loadMonthly();
            };
        });

        this.loadAll();
    }

    setActiveTab(index) {
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelectorAll('.sidebar-item')[index].classList.add('active');
    }

    async loadAll() {
        try {
            const response = await fetch(`${API_BASE_URL}/anniversaries`, {
                headers: {
                    ...window.app.auth.getAuthHeaders()
                }
            });
            
            if (!response.ok) {
                throw new Error('获取纪念日列表失败');
            }

            this.allData = await response.json();
            
            this.updateCounts(this.allData);
            this.renderList(this.allData);
        } catch (error) {
            this.showToast('加载失败，请重试', 'error');
        }
    }

    loadUpcoming() {
        const now = new Date();
        const upcoming = this.allData.filter(item => {
            const date = new Date(item.date);
            const diff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
            return diff >= 0 && diff <= 3;
        });
        
        this.renderList(upcoming);
    }

    loadMonthly() {
        const currentMonth = new Date().getMonth() + 1;
        const monthly = this.allData.filter(item => {
            const date = new Date(item.date);
            return date.getMonth() + 1 === currentMonth;
        });
        
        this.renderList(monthly);
    }

    updateCounts(data) {
        const counts = document.querySelectorAll('.sidebar-item span:last-child');
        counts[0].textContent = data.length || 0;
        
        const upcoming = data.filter(item => {
            const date = new Date(item.date);
            const now = new Date();
            const diff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
            return diff >= 0 && diff <= 3;
        });
        counts[1].textContent = upcoming.length;

        const currentMonth = new Date().getMonth() + 1;
        const monthly = data.filter(item => {
            const date = new Date(item.date);
            return date.getMonth() + 1 === currentMonth;
        });
        counts[2].textContent = monthly.length;
    }

    renderList(data) {
        const anniversaryList = document.querySelector('.anniversary-list');
        
        anniversaryList.innerHTML = '';
        
        if (!Array.isArray(data) || data.length === 0) {
            anniversaryList.innerHTML = `
                <div class="empty-state">
                    <h3>还没有加任何纪念日</h3>
                    <p>点击右上角的"添加纪念日"开始添加吧！</p>
                </div>
            `;
            return;
        }
        
        const typeMap = {
            love: '恋爱纪念',
            wedding: '结婚纪念',
            work: '工作纪念',
            other: '其他纪念'
        };

        const html = data.map(item => {
            const decryptedItem = this.decryptData(item);
            
            return `
                <div class="anniversary-item" data-id="${item.id}" data-type="${item.type}">
                    <div class="anniversary-info">
                        <div class="anniversary-date">${new Date(item.date).toLocaleDateString()}</div>
                        <div class="anniversary-type" data-type="${item.type}">${typeMap[item.type]}</div>
                        <div class="anniversary-title">${decryptedItem.title}</div>
                        <div class="anniversary-reminder">提前${item.reminder_days}天提醒</div>
                        ${decryptedItem.description ? `<div class="anniversary-desc">${decryptedItem.description}</div>` : ''}
                    </div>
                    <div class="anniversary-actions">
                        <button class="btn-edit" onclick="anniversaryManager.editAnniversary('${item.id}')">✏️</button>
                        <button class="btn-delete" onclick="anniversaryManager.deleteAnniversary('${item.id}')">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
        
        anniversaryList.innerHTML = html;
        this.updateCounts(data);
    }

    async deleteAnniversary(id) {
        const confirmed = await this.showConfirm('确定要删除这个纪念日吗？');
        if (!confirmed) return;
        
        const item = document.querySelector(`[data-id="${id}"]`);
        if (!item) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/anniversaries/${id}`, {
                method: 'DELETE',
                headers: {
                    ...window.app.auth.getAuthHeaders()
                }
            });
            
            if (!response.ok) throw new Error('删除失败');

            item.classList.add('deleting');
            
            setTimeout(() => {
                item.remove();
                const data = Array.from(document.querySelectorAll('.anniversary-item')).map(item => ({
                    date: new Date(item.querySelector('.anniversary-date').textContent),
                    reminder_days: parseInt(item.querySelector('.anniversary-reminder').textContent.match(/\d+/)[0])
                }));
                this.updateCounts(data);
                this.showToast('删除成功');
            }, 300);
        } catch (error) {
            this.showToast('删除失败，请重试', 'error');
            item.classList.remove('deleting');
        }
    }

    encryptData(data) {
        const encryptedData = {};
        const sensitiveFields = ['title', 'description'];
        
        for (let key in data) {
            if (sensitiveFields.includes(key)) {
                encryptedData[key] = CryptoJS.AES.encrypt(
                    data[key] || '', 
                    window.app.encryptKey
                ).toString();
            } else {
                encryptedData[key] = data[key];
            }
        }
        return encryptedData;
    }

    async saveAnniversary() {
        const form = document.getElementById('anniversaryForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        try {
            const encryptedData = this.encryptData(data);

            const response = await fetch(`${API_BASE_URL}/anniversaries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...window.app.auth.getAuthHeaders()
                },
                body: JSON.stringify(encryptedData)
            });

            if (!response.ok) throw new Error('保存失败');

            form.closest('dialog').close();
            this.loadAll();
            this.showToast('添加成功');
        } catch (error) {
            this.showToast('保存失败，请重试', 'error');
        }
    }

    async editAnniversary(id) {
        const item = document.querySelector(`[data-id="${id}"]`);
        if (!item) return;

        const data = this.decryptData({
            title: item.querySelector('.anniversary-title').textContent,
            date: new Date(item.querySelector('.anniversary-date').textContent).toISOString().split('T')[0],
            type: item.dataset.type,
            reminder_days: parseInt(item.querySelector('.anniversary-reminder').textContent.match(/\d+/)[0]),
            description: item.querySelector('.anniversary-desc')?.textContent || ''
        });

        const modal = document.createElement('dialog');
        modal.className = 'modal edit-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>编辑纪念日</h3>
                    <button class="close-btn" onclick="this.closest('dialog').close()">×</button>
                </div>
                <div class="modal-body">
                    <form id="editAnniversaryForm">
                        <div class="form-group">
                            <label>标题</label>
                            <input type="text" name="title" value="${data.title}" required>
                        </div>
                        <div class="form-group">
                            <label>日期</label>
                            <input type="date" name="date" value="${data.date}" required>
                        </div>
                        <div class="form-group">
                            <label>类型</label>
                            <select name="type">
                                <option value="love" ${data.type === 'love' ? 'selected' : ''}>恋爱纪念</option>
                                <option value="wedding" ${data.type === 'wedding' ? 'selected' : ''}>结婚纪念</option>
                                <option value="work" ${data.type === 'work' ? 'selected' : ''}>工作纪念</option>
                                <option value="other" ${data.type === 'other' ? 'selected' : ''}>其他纪念</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>提醒设置</label>
                            <select name="reminder_days">
                                <option value="0" ${data.reminder_days === 0 ? 'selected' : ''}>当天提醒</option>
                                <option value="1" ${data.reminder_days === 1 ? 'selected' : ''}>提前1天</option>
                                <option value="3" ${data.reminder_days === 3 ? 'selected' : ''}>提前3天</option>
                                <option value="7" ${data.reminder_days === 7 ? 'selected' : ''}>提前7天</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>备注</label>
                            <textarea name="description" rows="3" placeholder="添加一些备注信息...">${data.description}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel" onclick="this.closest('dialog').close()">取消</button>
                    <button class="btn-save" onclick="anniversaryManager.updateAnniversary('${id}')">保存</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.showModal();
    }

    async updateAnniversary(id) {
        const form = document.getElementById('editAnniversaryForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        try {
            const encryptedData = this.encryptData(data);

            const response = await fetch(`${API_BASE_URL}/anniversaries/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...window.app.auth.getAuthHeaders()
                },
                body: JSON.stringify(encryptedData)
            });

            if (!response.ok) throw new Error('更新失败');

            const item = document.querySelector(`[data-id="${id}"]`);
            if (!item) throw new Error('找不到要更新的纪念日');

            const typeMap = {
                love: '恋爱纪念',
                wedding: '结婚纪念',
                work: '工作纪念',
                other: '其他纪念'
            };

            item.dataset.type = data.type;
            item.querySelector('.anniversary-date').textContent = new Date(data.date).toLocaleDateString();
            item.querySelector('.anniversary-type').textContent = typeMap[data.type];
            item.querySelector('.anniversary-title').textContent = data.title;
            item.querySelector('.anniversary-reminder').textContent = `提前${data.reminder_days}天提醒`;
            
            const descEl = item.querySelector('.anniversary-desc');
            if (data.description) {
                if (descEl) {
                    descEl.textContent = data.description;
                } else {
                    const newDescEl = document.createElement('div');
                    newDescEl.className = 'anniversary-desc';
                    newDescEl.textContent = data.description;
                    item.querySelector('.anniversary-info').appendChild(newDescEl);
                }
            } else if (descEl) {
                descEl.remove();
            }

            form.closest('dialog').close();
            this.showToast('更新成功');
        } catch (error) {
            this.showToast('更新失败，请重试', 'error');
        }
    }

    showToast(message, type = 'success') {
        document.querySelectorAll('.toast').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

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

    decryptData(data) {
        const decryptedData = {...data};
        const sensitiveFields = ['title', 'description'];
        
        for (let key of sensitiveFields) {
            if (data[key]) {
                try {
                    const bytes = CryptoJS.AES.decrypt(data[key], window.app.encryptKey);
                    decryptedData[key] = bytes.toString(CryptoJS.enc.Utf8);
                } catch {
                    decryptedData[key] = data[key];
                }
            }
        }
        return decryptedData;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!window.app.checkPageAuth()) {
        return;
    }
    window.anniversaryManager = new AnniversaryManager();
}); 