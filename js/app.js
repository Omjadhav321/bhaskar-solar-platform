/**
 * Bhaskar Solar Platform - Main Application Module
 */

const App = {
    session: null,

    init() {
        DataStore.init();
        this.session = DataStore.session.get();
        if (this.session) {
            this.showDashboard();
        } else {
            this.showPage('loginPage');
        }
        this.bindEvents();
        this.applyTheme();
    },

    bindEvents() {
        document.querySelectorAll('.login-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchLoginTab(e.target.dataset.tab));
        });
        document.querySelectorAll('.nav-btn, .bottom-nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.currentTarget.dataset.section) {
                    this.navigateToSection(e.currentTarget.dataset.section);
                }
            });
        });
        document.querySelectorAll('.doc-tab').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchDocTab(e.target.dataset.docTab));
        });
    },

    switchLoginTab(tab) {
        document.querySelectorAll('.login-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        document.querySelectorAll('.login-form').forEach(form => {
            form.classList.toggle('active', form.id === tab + 'Login');
        });
    },

    doCustomerLogin() {
        const code = document.getElementById('customerCode')?.value.trim().toUpperCase();
        const phone = document.getElementById('customerPhone')?.value.trim();
        const address = document.getElementById('customerAddress')?.value.trim();

        if (!code) { this.showToast('Please enter your application code', 'warning'); return; }
        if (!phone || phone.length < 10) { this.showToast('Please enter a valid phone number', 'warning'); return; }

        let customer = DataStore.customers.getByAppCode(code);
        if (!customer) {
            const vendors = DataStore.users.getByType('vendor');
            customer = DataStore.customers.create({
                vendorId: vendors[0]?.id,
                name: 'Customer ' + code.slice(-4),
                phone: phone,
                address: address || 'Not provided'
            });
        }

        let user = DataStore.users.getByPhone(phone);
        if (!user) {
            user = DataStore.users.create({
                type: 'customer',
                customerId: customer.id,
                name: customer.name,
                phone: phone,
                address: address || customer.address,
                password: 'customer'
            });
        }

        this.session = DataStore.session.login(user);
        this.showToast('Welcome, ' + user.name + '!', 'success');
        this.showDashboard();
    },

    doVendorLogin() {
        const phone = document.getElementById('vendorPhone')?.value.trim();
        const code = document.getElementById('vendorCode')?.value.trim();

        if (!phone || phone.length < 10) { this.showToast('Please enter a valid phone number', 'warning'); return; }
        if (!code) { this.showToast('Please enter your access code', 'warning'); return; }

        const user = DataStore.users.validateLogin(phone, code, 'vendor');
        if (!user) {
            this.showToast('Invalid credentials. Please check your phone and access code.', 'error');
            return;
        }

        this.session = DataStore.session.login(user);
        this.showToast('Welcome, ' + user.name + '!', 'success');
        this.showDashboard();
    },

    registerVendor() {
        const name = document.getElementById('registerVendorName')?.value.trim();
        const phone = document.getElementById('registerVendorPhone')?.value.trim();
        const email = document.getElementById('registerVendorEmail')?.value.trim();
        const address = document.getElementById('registerVendorAddress')?.value.trim();
        const password = document.getElementById('registerVendorPassword')?.value;
        const confirmPassword = document.getElementById('registerVendorConfirmPassword')?.value;

        if (!name) { this.showToast('Please enter your business name', 'warning'); return; }
        if (!phone || phone.length < 10) { this.showToast('Please enter a valid phone number', 'warning'); return; }
        if (!password || password.length < 4) { this.showToast('Password must be at least 4 characters', 'warning'); return; }
        if (password !== confirmPassword) { this.showToast('Passwords do not match', 'warning'); return; }

        // Check if phone already exists
        const existingUser = DataStore.users.getByPhone(phone);
        if (existingUser) {
            this.showToast('This phone number is already registered', 'error');
            return;
        }

        // Create vendor account
        const user = DataStore.users.create({
            type: 'vendor',
            name: name,
            phone: phone,
            email: email || '',
            address: address || 'Not provided',
            password: password
        });

        this.showToast('Registration successful! Please login.', 'success');
        this.closeModal('vendorRegisterModal');

        // Clear registration form
        document.getElementById('registerVendorName').value = '';
        document.getElementById('registerVendorPhone').value = '';
        document.getElementById('registerVendorEmail').value = '';
        document.getElementById('registerVendorAddress').value = '';
        document.getElementById('registerVendorPassword').value = '';
        document.getElementById('registerVendorConfirmPassword').value = '';

        // Switch to vendor login tab
        this.switchLoginTab('vendor');
    },

    logout() {
        DataStore.session.logout();
        this.session = null;
        this.showToast('Logged out successfully', 'info');
        this.showPage('loginPage');
        document.querySelectorAll('.login-form input').forEach(input => input.value = '');
    },

    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        const page = document.getElementById(pageId);
        if (page) { page.classList.add('active'); }
    },

    showDashboard() {
        if (!this.session) return;

        if (this.session.type === 'customer') {
            this.showPage('customerDashboard');
            this.updateCustomerDashboard();
        } else {
            this.showPage('vendorDashboard');
            this.updateVendorDashboard();
        }
        Charts.init();
        Chat.init();
    },

    navigateToSection(section) {
        document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
        const sectionEl = document.getElementById(section);
        if (sectionEl) { sectionEl.classList.add('active'); }

        document.querySelectorAll('.nav-btn, .bottom-nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === section);
        });

        this.loadSectionData(section);
    },

    loadSectionData(section) {
        switch (section) {
            case 'production': this.loadProductionData(); break;
            case 'documents': this.loadDocuments(); break;
            case 'chat': Chat.loadContacts(); break;
            case 'customers': this.loadCustomers(); break;
            case 'projects': this.loadProjects(); break;
        }
    },

    updateCustomerDashboard() {
        const user = DataStore.users.getById(this.session?.userId);
        let customer = user?.customerId ? DataStore.customers.getById(user.customerId) : null;
        if (!customer) customer = DataStore.customers.getAll().find(c => c.phone === user?.phone);
        if (!customer) customer = DataStore.customers.getAll()[0];

        if (customer) {
            document.getElementById('customerName').textContent = customer.name;
            document.getElementById('customerAppCode').textContent = customer.appCode;
            document.getElementById('mobileUserName').textContent = customer.name;
            document.getElementById('mobileUserInitials').textContent = this.getInitials(customer.name);

            const cap = customer.systemCapacity || 5;
            DataStore.production.generateDailyData(customer.id, cap);
            const stats = DataStore.production.getStats(customer.id);

            Charts.updateStats({
                todayProduction: stats.today.toFixed(1),
                monthProduction: stats.thisMonth.toFixed(1),
                efficiency: stats.efficiency,
                co2Saved: stats.co2Saved
            });

            Charts.renderProductionChart('productionChartArea', {
                hourlyData: DataStore.production.generateDailyData(customer.id, cap).hourlyData,
                weekData: DataStore.production.getWeeklyData(customer.id),
                monthData: DataStore.production.getMonthlyData(customer.id)
            }, 'week');

            Charts.startRealTimeUpdates(customer.id);
        }
    },

    updateVendorDashboard() {
        const user = DataStore.users.getById(this.session?.userId);
        if (user) document.getElementById('vendorName').textContent = user.name;
        this.loadVendorStats();
    },

    loadVendorStats() {
        const customers = DataStore.customers.getByVendor(this.session?.userId);
        const counterEl = document.querySelector('.stats-showcase .animated-counter');
        if (counterEl) Charts.animateCounter(counterEl, customers.length);
    },

    loadProductionData() {
        let customer = null;
        if (this.session?.type === 'customer') {
            const user = DataStore.users.getById(this.session.userId);
            customer = DataStore.customers.getAll().find(c => c.phone === user?.phone);
        } else {
            customer = DataStore.customers.getAll()[0];
        }
        if (customer) {
            const stats = DataStore.production.getStats(customer.id);
            Charts.updateStats({
                todayProduction: stats.today.toFixed(1),
                monthProduction: stats.thisMonth.toFixed(1),
                efficiency: stats.efficiency,
                co2Saved: stats.co2Saved
            });
        }
    },

    loadDocuments() {
        let customerId = null;
        if (this.session?.type === 'customer') {
            const user = DataStore.users.getById(this.session.userId);
            const customer = DataStore.customers.getAll().find(c => c.phone === user?.phone);
            customerId = customer?.id;
        }
        const docs = customerId ? DataStore.documents.getByCustomer(customerId) : [];
        this.renderDocuments(docs);
    },

    renderDocuments(docs) {
        ['warranty', 'quotation', 'utility', 'contracts'].forEach(cat => {
            const container = document.querySelector('#' + cat + ' .doc-list');
            if (!container) return;
            const catDocs = docs.filter(d => d.type === cat);
            if (!catDocs.length) {
                container.innerHTML = '<div class="no-docs"><p>No documents uploaded</p></div>';
                return;
            }
            container.innerHTML = catDocs.map(d => `
                <div class="doc-item">
                    <div class="doc-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/></svg></div>
                    <div class="doc-info"><span class="doc-name">${d.name}</span><span class="doc-meta">${d.type} • ${(d.size/1024).toFixed(1)} KB</span></div>
                    <button class="btn-sm" onclick="App.viewDocument('${d.id}')">View</button>
                    <button class="btn-sm btn-danger" onclick="App.deleteDocument('${d.id}')">×</button>
                </div>
            `).join('');
        });
    },

    uploadDocument() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.jpg,.jpeg,.png';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) { this.showToast('Max 5MB', 'error'); return; }
            const reader = new FileReader();
            reader.onload = (ev) => {
                let customerId = null;
                if (this.session?.type === 'customer') {
                    const user = DataStore.users.getById(this.session.userId);
                    const customer = DataStore.customers.getAll().find(c => c.phone === user?.phone);
                    customerId = customer?.id;
                }
                if (!customerId) { this.showToast('Customer not found', 'error'); return; }
                const docType = prompt('Type (warranty/quotation/utility/contracts):', 'warranty');
                DataStore.documents.create({ customerId, name: file.name, type: docType || 'warranty', data: ev.target.result, size: file.size });
                this.showToast('Uploaded!', 'success');
                this.loadDocuments();
            };
            reader.readAsDataURL(file);
        };
        input.click();
    },

    viewDocument(id) {
        const doc = DataStore.documents.getById(id);
        if (!doc) return;
        const win = window.open('', '_blank');
        win.document.write(`<html><head><title>${doc.name}</title></head><body style="margin:0;padding:20px;background:#f5f5f5;"><img src="${doc.data}" style="max-width:100%;"></body></html>`);
    },

    deleteDocument(id) {
        if (!confirm('Delete this document?')) return;
        DataStore.documents.delete(id);
        this.showToast('Deleted', 'info');
        this.loadDocuments();
    },

    loadCustomers() {
        if (this.session?.type !== 'vendor') return;
        const customers = DataStore.customers.getByVendor(this.session.userId);
        const container = document.getElementById('customerList');
        if (!container) return;

        if (!customers.length) {
            container.innerHTML = '<div class="no-data"><p>No customers yet</p><button class="btn-primary" onclick="App.showAddCustomerModal()">Add Customer</button></div>';
            return;
        }

        container.innerHTML = `
            <div class="customer-list-header">
                <input type="text" class="search-input" placeholder="Search..." onkeyup="App.searchCustomers(this.value)">
                <button class="btn-primary" onclick="App.showAddCustomerModal()">Add Customer</button>
            </div>
            <div class="customer-grid">
                ${customers.map(c => `
                    <div class="customer-card">
                        <div class="customer-card-header">
                            <div class="customer-avatar">${this.getInitials(c.name)}</div>
                            <div class="customer-info"><h4>${c.name}</h4><span class="customer-code">${c.appCode}</span></div>
                            <span class="status ${c.status}">${c.status}</span>
                        </div>
                        <div class="customer-card-body">
                            <p><strong>Phone:</strong> ${c.phone}</p>
                            <p><strong>System:</strong> ${c.systemCapacity} kW</p>
                        </div>
                        <div class="customer-card-actions">
                            <button class="btn-sm" onclick="App.editCustomer('${c.id}')">Edit</button>
                            <button class="btn-sm btn-danger" onclick="App.deleteCustomer('${c.id}')">×</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    showAddCustomerModal() { this.showModal('addCustomerModal'); },

    addCustomer() {
        const name = document.getElementById('newCustomerName')?.value.trim();
        const phone = document.getElementById('newCustomerPhone')?.value.trim();
        const address = document.getElementById('newCustomerAddress')?.value.trim();
        const capacity = parseFloat(document.getElementById('newCustomerCapacity')?.value) || 5;
        const panels = parseInt(document.getElementById('newCustomerPanels')?.value) || 12;

        if (!name || !phone) { this.showToast('Name and phone required', 'warning'); return; }

        const customer = DataStore.customers.create({
            vendorId: this.session.userId, name, phone, address: address || 'N/A',
            systemCapacity: capacity, panels, status: 'pending'
        });

        DataStore.users.create({
            type: 'customer', customerId: customer.id, name, phone,
            address: address || 'N/A', password: 'customer'
        });

        this.showToast('Created! Code: ' + customer.appCode, 'success');
        this.closeModal('addCustomerModal');
        this.loadCustomers();
    },

    editCustomer(id) {
        const c = DataStore.customers.getById(id);
        if (!c) return;
        document.getElementById('editCustomerId').value = c.id;
        document.getElementById('editCustomerName').value = c.name;
        document.getElementById('editCustomerPhone').value = c.phone;
        document.getElementById('editCustomerAddress').value = c.address;
        document.getElementById('editCustomerCapacity').value = c.systemCapacity;
        document.getElementById('editCustomerPanels').value = c.panels;
        document.getElementById('editCustomerStatus').value = c.status;
        this.showModal('editCustomerModal');
    },

    updateCustomer() {
        DataStore.customers.update(document.getElementById('editCustomerId')?.value, {
            name: document.getElementById('editCustomerName')?.value.trim(),
            phone: document.getElementById('editCustomerPhone')?.value.trim(),
            address: document.getElementById('editCustomerAddress')?.value.trim(),
            systemCapacity: parseFloat(document.getElementById('editCustomerCapacity')?.value) || 5,
            panels: parseInt(document.getElementById('editCustomerPanels')?.value) || 12,
            status: document.getElementById('editCustomerStatus')?.value
        });
        this.showToast('Updated', 'success');
        this.closeModal('editCustomerModal');
        this.loadCustomers();
    },

    deleteCustomer(id) {
        if (!confirm('Delete this customer?')) return;
        DataStore.customers.delete(id);
        this.showToast('Deleted', 'info');
        this.loadCustomers();
    },

    searchCustomers(q) {
        const customers = DataStore.customers.search(q, this.session.userId);
        const container = document.querySelector('.customer-grid');
        if (!container) return;
        container.innerHTML = customers.map(c => `
            <div class="customer-card">
                <div class="customer-card-header">
                    <div class="customer-avatar">${this.getInitials(c.name)}</div>
                    <div class="customer-info"><h4>${c.name}</h4><span class="customer-code">${c.appCode}</span></div>
                    <span class="status ${c.status}">${c.status}</span>
                </div>
                <div class="customer-card-body"><p><strong>Phone:</strong> ${c.phone}</p></div>
                <div class="customer-card-actions">
                    <button class="btn-sm" onclick="App.editCustomer('${c.id}')">Edit</button>
                    <button class="btn-sm btn-danger" onclick="App.deleteCustomer('${c.id}')">×</button>
                </div>
            </div>
        `).join('');
    },

    loadProjects() {
        const customers = DataStore.customers.getByVendor(this.session?.userId).filter(c => c.status === 'active' || c.status === 'pending');
        const container = document.getElementById('projectList');
        if (!container) return;
        if (!customers.length) { container.innerHTML = '<div class="no-data"><p>No active projects</p></div>'; return; }
        container.innerHTML = customers.map(p => `
            <div class="project-card">
                <div class="project-header"><h4>${p.name}</h4><span class="status ${p.status}">${p.status}</span></div>
                <div class="project-body">
                    <div class="project-stat"><span class="label">System</span><span class="value">${p.systemCapacity} kW</span></div>
                    <div class="project-stat"><span class="label">Code</span><span class="value">${p.appCode}</span></div>
                </div>
            </div>
        `).join('');
    },

    showModal(id) { const m = document.getElementById(id); if (m) { m.classList.add('active'); document.body.style.overflow = 'hidden'; } },
    closeModal(id) { const m = document.getElementById(id); if (m) { m.classList.remove('active'); document.body.style.overflow = ''; } },
    toggleMobileMenu() { document.getElementById('mobileMenu')?.classList.toggle('active'); document.querySelector('.mobile-menu-overlay')?.classList.toggle('active'); },
    closeMobileMenu() { document.getElementById('mobileMenu')?.classList.remove('active'); document.querySelector('.mobile-menu-overlay')?.classList.remove('active'); },
    toggleTheme() { const t = DataStore.settings.get().theme === 'light' ? 'dark' : 'light'; DataStore.settings.setTheme(t); this.applyTheme(); },
    applyTheme() { const t = DataStore.settings.get().theme; document.documentElement.setAttribute('data-theme', t); document.querySelectorAll('.theme-toggle').forEach(el => el.classList.toggle('dark', t === 'dark')); },
    showToast(msg, type = 'info') { const c = document.getElementById('toastContainer'); if (!c) return; const t = document.createElement('div'); t.className = 'toast toast-' + type; t.innerHTML = `<span class="toast-message">${msg}</span><button class="toast-close" onclick="this.parentElement.remove()">×</button>`; c.appendChild(t); setTimeout(() => { t.classList.add('fade-out'); setTimeout(() => t.remove(), 300); }, 4000); },
    getInitials(name) { return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??'; },
    switchDocTab(tab) { document.querySelectorAll('.doc-tab').forEach(b => b.classList.toggle('active', b.dataset.docTab === tab)); document.querySelectorAll('.doc-panel').forEach(p => p.classList.toggle('active', p.id === tab)); }
};

document.addEventListener('DOMContentLoaded', () => App.init());

function doCustomerLogin() { App.doCustomerLogin(); }
function doVendorLogin() { App.doVendorLogin(); }
function logout() { App.logout(); }
function toggleMobileMenu() { App.toggleMobileMenu(); }
function closeMobileMenu() { App.closeMobileMenu(); }
function toggleTheme() { App.toggleTheme(); }
function showModal(id) { App.showModal(id); }
function closeModal(id) { App.closeModal(id); }
function sendChatMessage() { Chat.sendMessage(); }
function calculateEnergy() { Calculators.calculateEnergy(); }
function calculateSavings() { Calculators.calculateSavings(); }
function convertWatts() { Calculators.convertWatts(); }
function calculateBattery() { Calculators.calculateBattery(); }
function calculateRoofArea() { Calculators.calculateRoofArea(); }
function calculateTempDerate() { Calculators.calculateTempDerate(); }
function setChartPeriod(period) {
    const session = DataStore.session.get();
    let customer = null;
    if (session?.type === 'customer') {
        const user = DataStore.users.getById(session.userId);
        customer = DataStore.customers.getAll().find(c => c.phone === user?.phone);
    } else {
        customer = DataStore.customers.getAll()[0];
    }
    if (customer) Charts.setChartPeriod(period, customer.id);
}
function navigateToSection(page, section) { App.navigateToSection(section); }
