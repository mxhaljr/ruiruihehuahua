class AnniversaryManager {
    constructor() {
        this.form = document.getElementById('anniversaryForm');
        this.listContainer = document.getElementById('anniversaryList');
        this.modal = new bootstrap.Modal(document.getElementById('anniversaryModal'));
        this.saveButton = document.getElementById('saveButton');
        this.currentEditId = null;
        this.initEventListeners();
        this.loadAnniversaries();
    }

    initEventListeners() {
        this.saveButton.addEventListener('click', () => this.handleSave());
        
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                switch(action) {
                    case 'all':
                        this.showAllAnniversaries();
                        break;
                    case 'upcoming':
                        this.showUpcomingAnniversaries();
                        break;
                    case 'month':
                        this.showMonthAnniversaries();
                        break;
                }
            });
        });
    }

    async loadAnniversaries() {
        try {
            const response = await fetch(`${window.app.apiBaseUrl}/anniversaries`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('获取纪念日列表失败');
            
            const anniversaries = await response.json();
            console.log('加载的纪念日数据:', anniversaries);
            
            this.updateCounts(anniversaries);
            this.renderAnniversaryList(anniversaries);
            return anniversaries;
        } catch (error) {
            console.error('加载纪念日列表失败:', error);
            alert('加载纪念日列表失败');
        }
    }

    renderAnniversaryList(anniversaries) {
        this.listContainer.innerHTML = anniversaries.map(anniversary => `
            <div class="col-12 mb-3">
                <div class="card h-100 border-0 shadow-sm">
                    <div class="card-body p-0">
                        <div class="d-flex align-items-center p-3 border-bottom">
                            <div class="flex-grow-1">
                                <div class="d-flex align-items-center">
                                    <h5 class="mb-0 fw-bold">${this.decrypt(anniversary.title)}</h5>
                                    ${anniversary.important ? '<i class="fas fa-star text-warning ms-2"></i>' : ''}
                                </div>
                                <small class="text-muted">
                                    ${new Date(anniversary.date).toLocaleDateString()}
                                    <span class="badge ms-2 bg-${this.getTypeColor(anniversary.type)}">
                                        ${this.getTypeText(anniversary.type)}
                                    </span>
                                </small>
                            </div>
                            <div class="d-flex gap-2">
                                <button class="btn btn-icon" onclick="anniversaryManager.editAnniversary(${anniversary.id})">
                                    <i class="fas fa-edit text-primary"></i>
                                </button>
                                <button class="btn btn-icon" onclick="anniversaryManager.deleteAnniversary(${anniversary.id})">
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
                                            ${this.getReminderText(anniversary.reminder_days)}
                                        </span>
                                    </div>
                                </div>
                                ${anniversary.description ? `
                                    <div class="col">
                                        <div class="d-flex align-items-center">
                                            <i class="fas fa-comment-alt me-2 text-info"></i>
                                            <span class="text-muted">${this.decrypt(anniversary.description)}</span>
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

    getTypeColor(type) {
        const colors = {
            'love': 'danger',
            'wedding': 'primary',
            'work': 'success',
            'other': 'info'
        };
        return colors[type] || 'info';
    }

    getTypeText(type) {
        const texts = {
            'love': '恋爱纪念',
            'wedding': '结婚纪念',
            'work': '工作纪念',
            'other': '其他纪念'
        };
        return texts[type] || '其他纪念';
    }

    getReminderText(days) {
        switch(parseInt(days)) {
            case 0: return '当天提醒';
            case 1: return '提前1天';
            case 2: return '提前2天';
            case 3: return '提前3天';
            case 7: return '提前7天';
            default: return '当天提醒';
        }
    }

    // 加密函数
    encrypt(text) {
        // 使用与birthday.js相同的加密方法
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
        const date = document.getElementById('date').value;
        const type = document.getElementById('type').value;
        const description = document.getElementById('description').value.trim();
        const reminder_days = parseInt(document.getElementById('reminder_days').value);
        const important = document.getElementById('important').checked ? 1 : 0;

        if (!title || !date) {
            alert('请填写必填字段');
            return;
        }

        const anniversaryData = {
            title: this.encrypt(title),
            date,
            type,
            description: description ? this.encrypt(description) : '',
            reminder_days,
            important
        };

        try {
            if (this.currentEditId) {
                await this.updateAnniversary(this.currentEditId, anniversaryData);
            } else {
                await this.createAnniversary(anniversaryData);
            }
            
            this.modal.hide();
            this.form.reset();
            this.currentEditId = null;
            await this.loadAnniversaries();
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败');
        }
    }

    async createAnniversary(anniversaryData) {
        const response = await fetch(`${window.app.apiBaseUrl}/anniversaries`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(anniversaryData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '添加纪念日失败');
        }
        alert('添加成功！');
    }

    async deleteAnniversary(id) {
        if (!confirm('确定要删除这条纪念日信息吗？')) return;

        try {
            const response = await fetch(`${window.app.apiBaseUrl}/anniversaries/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('删除失败');
            
            this.loadAnniversaries();
            alert('删除成功！');
        } catch (error) {
            console.error('删除失败:', error);
            alert('删除失败');
        }
    }

    async editAnniversary(id) {
        try {
            const response = await fetch(`${window.app.apiBaseUrl}/anniversaries/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('获取纪念日信息失败');
            
            const anniversary = await response.json();
            
            document.getElementById('title').value = this.decrypt(anniversary.title);
            document.getElementById('date').value = anniversary.date.split('T')[0];
            document.getElementById('type').value = anniversary.type;
            document.getElementById('description').value = anniversary.description ? this.decrypt(anniversary.description) : '';
            document.getElementById('reminder_days').value = anniversary.reminder_days;
            document.getElementById('important').checked = anniversary.important === 1;
            
            this.currentEditId = id;
            document.getElementById('modalTitle').textContent = '编辑纪念日';
            this.modal.show();
        } catch (error) {
            console.error('编辑失败:', error);
            alert('获取纪念日信息失败');
        }
    }

    async updateAnniversary(id, anniversaryData) {
        const response = await fetch(`${window.app.apiBaseUrl}/anniversaries/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(anniversaryData)
        });

        if (!response.ok) throw new Error('更新失败');
        alert('更新成功！');
    }

    async showAllAnniversaries() {
        this.setActiveTab('total');
        await this.loadAnniversaries();
    }

    async showUpcomingAnniversaries() {
        this.setActiveTab('upcoming');
        try {
            const response = await fetch(`${window.app.apiBaseUrl}/anniversaries/upcoming/30`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('获取即将到来的纪念日失败');
            
            const anniversaries = await response.json();
            this.renderAnniversaryList(anniversaries);
        } catch (error) {
            console.error('加载即将到来的纪念日失败:', error);
        }
    }

    async showMonthAnniversaries() {
        this.setActiveTab('month');
        try {
            const currentMonth = new Date().getMonth() + 1;
            const response = await fetch(`${window.app.apiBaseUrl}/anniversaries/month/${currentMonth}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('获取当月纪念日失败');
            
            const anniversaries = await response.json();
            this.renderAnniversaryList(anniversaries);
        } catch (error) {
            console.error('加载当月纪念日失败:', error);
        }
    }

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

    updateCounts(anniversaries) {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        
        document.getElementById('totalCount').textContent = anniversaries.length;
        
        const upcomingCount = anniversaries.filter(anniversary => {
            const diff = this.getDateDiff(today, new Date(anniversary.date));
            return diff <= 30 && diff >= 0;
        }).length;
        document.getElementById('upcomingCount').textContent = upcomingCount;
        
        const monthCount = anniversaries.filter(anniversary => {
            return new Date(anniversary.date).getMonth() + 1 === currentMonth;
        }).length;
        document.getElementById('monthCount').textContent = monthCount;
    }

    getDateDiff(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.round((date2 - date1) / oneDay);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.anniversaryManager = new AnniversaryManager();
}); 