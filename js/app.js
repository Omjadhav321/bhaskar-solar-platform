/**
 * Bhaskar Solar Platform - Main Application Module
 * Enhanced for mobile browser compatibility with robust error handling
 */

const App = {
    session: null,

    async init() {
        try {
            console.log('=== App initializing ===');
            console.log('User Agent:', navigator.userAgent);
            console.log('Platform:', navigator.platform);

            // Check localStorage availability
            if (!this.isStorageAvailable()) {
                console.warn('Local storage not available - using memory only');
            }

            // Initialize data store - this is async now
            try {
                await DataStore.init();
            } catch (e) {
                console.error('DataStore init failed, using fallback:', e);
                // Ensure DataStore has minimal structure
                if (!DataStore.cache) DataStore.cache = {};
                if (!DataStore.cache.bs_users) DataStore.cache.bs_users = [];
                if (!DataStore.cache.bs_customers) DataStore.cache.bs_customers = [];
                if (!DataStore.cache.bs_session) DataStore.cache.bs_session = null;
            }

            // Debug: Check what's in localStorage
            console.log('=== LocalStorage Check ===');
            try {
                console.log('bs_users:', localStorage.getItem('bs_users'));
                console.log('bs_session:', localStorage.getItem('bs_session'));
                console.log('bs_customers:', localStorage.getItem('bs_customers'));
            } catch (e) {
                console.warn('Could not read localStorage:', e);
            }

            // Get session
            try {
                this.session = DataStore.session.get();
            } catch (e) {
                console.error('Session get failed:', e);
                this.session = null;
            }
            console.log('=== Session Check ===');
            console.log('Session restored:', this.session);

            if (this.session && this.session.userId) {
                // Verify user still exists
                let user = null;
                try {
                    user = DataStore.users.getById(this.session.userId);
                } catch (e) {
                    console.error('User lookup failed:', e);
                }
                console.log('User for session:', user);

                if (user) {
                    console.log('✓ Valid session, showing dashboard');
                    this.showDashboard();
                } else {
                    console.log('✗ Invalid session (user not found), clearing and showing login');
                    try {
                        DataStore.session.logout();
                    } catch (e) {
                        console.warn('Logout failed:', e);
                    }
                    this.session = null;
                    this.showPage('loginPage');
                }
            } else {
                console.log('✗ No session, showing login');
                this.showPage('loginPage');
            }

            this.bindEvents();
            this.applyTheme();
            console.log('=== App init complete ===');
        } catch (err) {
            console.error('App initialization error:', err);
            // Show login page as fallback
            this.showPage('loginPage');
            this.showToast('App initialized with some errors. Please refresh if issues persist.', 'warning');
        }
    },

    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },

    bindEvents() {
        try {
            // Login tab switching
            document.querySelectorAll('.login-tabs .tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const tab = e.currentTarget.dataset.tab;
                    console.log('Tab clicked:', tab);
                    this.switchLoginTab(tab);
                });
            });

            // Navigation buttons
            document.querySelectorAll('.nav-btn, .bottom-nav-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (e.currentTarget.dataset.section) {
                        this.navigateToSection(e.currentTarget.dataset.section);
                    }
                });
            });

            // Document tabs
            document.querySelectorAll('.doc-tab').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchDocTab(e.target.dataset.docTab);
                });
            });

            console.log('Events bound successfully');
        } catch (e) {
            console.error('Error binding events:', e);
        }
    },

    switchLoginTab(tab) {
        try {
            console.log('Switching to tab:', tab);
            document.querySelectorAll('.login-tabs .tab-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tab);
            });
            document.querySelectorAll('.login-form').forEach(form => {
                form.classList.toggle('active', form.id === tab + 'Login');
            });
        } catch (e) {
            console.error('Error switching login tab:', e);
        }
    },

    doCustomerLogin() {
        try {
            const codeEl = document.getElementById('customerCode');
            const phoneEl = document.getElementById('customerPhone');
            const addressEl = document.getElementById('customerAddress');

            const code = codeEl?.value?.trim().toUpperCase() || '';
            const phone = phoneEl?.value?.trim() || '';
            const address = addressEl?.value?.trim() || '';

            if (!code) { this.showToast('Please enter your application code', 'warning'); return; }
            if (!phone || phone.length < 10) { this.showToast('Please enter a valid phone number', 'warning'); return; }

            // Check if customer exists with this code
            let customer = null;
            try {
                customer = DataStore.customers.getByAppCode(code);
            } catch (e) {
                console.error('Error finding customer by code:', e);
            }

            if (!customer) {
                // Check if any vendors exist
                let vendors = [];
                try {
                    vendors = DataStore.users.getByType('vendor');
                } catch (e) {
                    console.error('Error getting vendors:', e);
                }
                if (!vendors.length) {
                    this.showToast('No vendors registered yet. Please wait for vendor registration.', 'warning');
                    return;
                }
                // Create new customer with the code
                try {
                    customer = DataStore.customers.create({
                        vendorId: vendors[0]?.id,
                        name: 'Customer ' + code.slice(-4),
                        phone: phone,
                        address: address || 'Not provided'
                    });
                } catch (e) {
                    console.error('Error creating customer:', e);
                    this.showToast('Error creating account. Please try again.', 'error');
                    return;
                }
            }

            // Find or create user account
            let user = null;
            try {
                user = DataStore.users.getByPhone(phone);
            } catch (e) {
                console.error('Error finding user by phone:', e);
            }

            if (!user) {
                try {
                    user = DataStore.users.create({
                        type: 'customer',
                        customerId: customer.id,
                        name: customer.name,
                        phone: phone,
                        address: address || customer.address,
                        password: 'customer'
                    });
                } catch (e) {
                    console.error('Error creating user:', e);
                    this.showToast('Error creating account. Please try again.', 'error');
                    return;
                }
            }

            this.session = DataStore.session.login(user);
            this.showToast('Welcome, ' + user.name + '!', 'success');
            this.showDashboard();
        } catch (e) {
            console.error('Customer login error:', e);
            this.showToast('Login failed. Please try again.', 'error');
        }
    },

    doVendorLogin() {
        try {
            const phoneEl = document.getElementById('vendorPhone');
            const codeEl = document.getElementById('vendorCode');

            const phone = phoneEl?.value?.trim() || '';
            const code = codeEl?.value?.trim() || '';

            if (!phone || phone.length < 10) { this.showToast('Please enter a valid phone number', 'warning'); return; }
            if (!code) { this.showToast('Please enter your access code', 'warning'); return; }

            let user = null;
            try {
                user = DataStore.users.validateLogin(phone, code, 'vendor');
            } catch (e) {
                console.error('Error validating login:', e);
            }
            console.log('Login attempt - user found:', user);

            if (!user) {
                this.showToast('Invalid credentials. Please check your phone and access code.', 'error');
                return;
            }

            this.session = DataStore.session.login(user);
            console.log('Session created:', this.session);

            this.showToast('Welcome, ' + user.name + '!', 'success');
            this.showDashboard();
        } catch (e) {
            console.error('Vendor login error:', e);
            this.showToast('Login failed. Please try again.', 'error');
        }
    },

    registerVendor() {
        try {
            const name = document.getElementById('registerVendorName')?.value?.trim() || '';
            const phone = document.getElementById('registerVendorPhone')?.value?.trim() || '';
            const email = document.getElementById('registerVendorEmail')?.value?.trim() || '';
            const address = document.getElementById('registerVendorAddress')?.value?.trim() || '';
            const password = document.getElementById('registerVendorPassword')?.value || '';
            const confirmPassword = document.getElementById('registerVendorConfirmPassword')?.value || '';

            if (!name) { this.showToast('Please enter your business name', 'warning'); return; }
            if (!phone || phone.length < 10) { this.showToast('Please enter a valid phone number', 'warning'); return; }
            if (!password || password.length < 4) { this.showToast('Password must be at least 4 characters', 'warning'); return; }
            if (password !== confirmPassword) { this.showToast('Passwords do not match', 'warning'); return; }

            // Check if phone already exists
            let existingUser = null;
            try {
                existingUser = DataStore.users.getByPhone(phone);
            } catch (e) {
                console.error('Error checking existing user:', e);
            }

            if (existingUser) {
                this.showToast('This phone number is already registered', 'error');
                return;
            }

            // Create vendor account
            let user = null;
            try {
                user = DataStore.users.create({
                    type: 'vendor',
                    name: name,
                    phone: phone,
                    email: email || '',
                    address: address || 'Not provided',
                    password: password
                });
            } catch (e) {
                console.error('Error creating vendor:', e);
                this.showToast('Registration failed. Please try again.', 'error');
                return;
            }

            console.log('User created:', user);

            this.showToast('Registration successful! Please login.', 'success');
            this.closeModal('vendorRegisterModal');

            // Clear registration form safely
            const clearEl = (id) => { const el = document.getElementById(id); if (el) el.value = ''; };
            clearEl('registerVendorName');
            clearEl('registerVendorPhone');
            clearEl('registerVendorEmail');
            clearEl('registerVendorAddress');
            clearEl('registerVendorPassword');
            clearEl('registerVendorConfirmPassword');

            // Switch to vendor login tab
            this.switchLoginTab('vendor');
        } catch (e) {
            console.error('Vendor registration error:', e);
            this.showToast('Registration failed. Please try again.', 'error');
        }
    },

    logout() {
        try {
            DataStore.session.logout();
            this.session = null;
            this.showToast('Logged out successfully', 'info');
            this.showPage('loginPage');
            document.querySelectorAll('.login-form input').forEach(input => input.value = '');
        } catch (e) {
            console.error('Logout error:', e);
            this.session = null;
            this.showPage('loginPage');
        }
    },

    showPage(pageId) {
        try {
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
            const page = document.getElementById(pageId);
            if (page) { page.classList.add('active'); }
        } catch (e) {
            console.error('Error showing page:', e);
        }
    },

    showDashboard() {
        try {
            if (!this.session) return;

            if (this.session.type === 'customer') {
                this.showPage('customerDashboard');
                this.updateCustomerDashboard();
            } else {
                this.showPage('vendorDashboard');
                this.updateVendorDashboard();
            }

            // Safely initialize charts and chat
            try { Charts.init(); } catch (e) { console.warn('Charts init failed:', e); }
            try { Chat.init(); } catch (e) { console.warn('Chat init failed:', e); }
        } catch (e) {
            console.error('Error showing dashboard:', e);
            this.showToast('Error loading dashboard', 'error');
        }
    },

    navigateToSection(section) {
        try {
            document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
            const sectionEl = document.getElementById(section);
            if (sectionEl) { sectionEl.classList.add('active'); }

            document.querySelectorAll('.nav-btn, .bottom-nav-item').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.section === section);
            });

            this.loadSectionData(section);
        } catch (e) {
            console.error('Error navigating to section:', e);
        }
    },

    loadSectionData(section) {
        try {
            switch (section) {
                case 'production': this.loadProductionData(); break;
                case 'documents': this.loadDocuments(); break;
                case 'chat': Chat.loadContacts(); break;
                case 'customers': this.loadCustomers(); break;
                case 'projects': this.loadProjects(); break;
            }
        } catch (e) {
            console.error('Error loading section data:', e);
        }
    },

    updateCustomerDashboard() {
        try {
            let user = null;
            try {
                user = DataStore.users.getById(this.session?.userId);
            } catch (e) { console.warn('Could not get user:', e); }

            let customer = null;
            try {
                customer = user?.customerId ? DataStore.customers.getById(user.customerId) : null;
            } catch (e) { console.warn('Could not get customer by customerId:', e); }

            if (!customer) {
                try {
                    customer = DataStore.customers.getAll().find(c => c.phone === user?.phone);
                } catch (e) { console.warn('Could not find customer by phone:', e); }
            }
            if (!customer) {
                try {
                    customer = DataStore.customers.getAll()[0];
                } catch (e) { console.warn('Could not get first customer:', e); }
            }

            if (customer) {
                const setName = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
                setName('customerName', customer.name);
                setName('customerAppCode', customer.appCode);
                setName('mobileUserName', customer.name);
                setName('mobileUserInitials', this.getInitials(customer.name));

                const cap = customer.systemCapacity || 5;

                try {
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
                } catch (e) {
                    console.warn('Error loading production data:', e);
                }
            }
        } catch (e) {
            console.error('Error updating customer dashboard:', e);
        }
    },

    updateVendorDashboard() {
        try {
            const user = DataStore.users.getById(this.session?.userId);
            const el = document.getElementById('vendorName');
            if (user && el) el.textContent = user.name;
            this.loadVendorStats();
        } catch (e) {
            console.error('Error updating vendor dashboard:', e);
        }
    },

    loadVendorStats() {
        try {
            const customers = DataStore.customers.getByVendor(this.session?.userId);
            const counterEl = document.querySelector('.stats-showcase .animated-counter');
            if (counterEl) Charts.animateCounter(counterEl, customers.length);
        } catch (e) {
            console.warn('Error loading vendor stats:', e);
        }
    },

    loadProductionData() {
        try {
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
        } catch (e) {
            console.error('Error loading production data:', e);
        }
    },

    loadDocuments() {
        try {
            let customerId = null;
            if (this.session?.type === 'customer') {
                const user = DataStore.users.getById(this.session.userId);
                const customer = DataStore.customers.getAll().find(c => c.phone === user?.phone);
                customerId = customer?.id;
            }
            const docs = customerId ? DataStore.documents.getByCustomer(customerId) : [];
            this.renderDocuments(docs);
        } catch (e) {
            console.error('Error loading documents:', e);
        }
    },

    renderDocuments(docs) {
        try {
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
        } catch (e) {
            console.error('Error rendering documents:', e);
        }
    },

    uploadDocument() {
        try {
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
        } catch (e) {
            console.error('Error uploading document:', e);
            this.showToast('Upload failed', 'error');
        }
    },

    viewDocument(id) {
        try {
            const doc = DataStore.documents.getById(id);
            if (!doc) return;
            const win = window.open('', '_blank');
            win.document.write(`<html><head><title>${doc.name}</title></head><body style="margin:0;padding:20px;background:#f5f5f5;"><img src="${doc.data}" style="max-width:100%;"></body></html>`);
        } catch (e) {
            console.error('Error viewing document:', e);
            this.showToast('Could not open document', 'error');
        }
    },

    deleteDocument(id) {
        try {
            if (!confirm('Delete this document?')) return;
            DataStore.documents.delete(id);
            this.showToast('Deleted', 'info');
            this.loadDocuments();
        } catch (e) {
            console.error('Error deleting document:', e);
        }
    },

    loadCustomers() {
        try {
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
        } catch (e) {
            console.error('Error loading customers:', e);
        }
    },

    showAddCustomerModal() { this.showModal('addCustomerModal'); },

    addCustomer() {
        try {
            const name = document.getElementById('newCustomerName')?.value?.trim() || '';
            const phone = document.getElementById('newCustomerPhone')?.value?.trim() || '';
            const address = document.getElementById('newCustomerAddress')?.value?.trim() || '';
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
        } catch (e) {
            console.error('Error adding customer:', e);
            this.showToast('Failed to add customer', 'error');
        }
    },

    editCustomer(id) {
        try {
            const c = DataStore.customers.getById(id);
            if (!c) return;
            const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
            setVal('editCustomerId', c.id);
            setVal('editCustomerName', c.name);
            setVal('editCustomerPhone', c.phone);
            setVal('editCustomerAddress', c.address);
            setVal('editCustomerCapacity', c.systemCapacity);
            setVal('editCustomerPanels', c.panels);
            setVal('editCustomerStatus', c.status);
            this.showModal('editCustomerModal');
        } catch (e) {
            console.error('Error editing customer:', e);
        }
    },

    updateCustomer() {
        try {
            DataStore.customers.update(document.getElementById('editCustomerId')?.value, {
                name: document.getElementById('editCustomerName')?.value?.trim() || '',
                phone: document.getElementById('editCustomerPhone')?.value?.trim() || '',
                address: document.getElementById('editCustomerAddress')?.value?.trim() || '',
                systemCapacity: parseFloat(document.getElementById('editCustomerCapacity')?.value) || 5,
                panels: parseInt(document.getElementById('editCustomerPanels')?.value) || 12,
                status: document.getElementById('editCustomerStatus')?.value || 'pending'
            });
            this.showToast('Updated', 'success');
            this.closeModal('editCustomerModal');
            this.loadCustomers();
        } catch (e) {
            console.error('Error updating customer:', e);
            this.showToast('Failed to update', 'error');
        }
    },

    deleteCustomer(id) {
        try {
            if (!confirm('Delete this customer?')) return;
            DataStore.customers.delete(id);
            this.showToast('Deleted', 'info');
            this.loadCustomers();
        } catch (e) {
            console.error('Error deleting customer:', e);
        }
    },

    searchCustomers(q) {
        try {
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
        } catch (e) {
            console.error('Error searching customers:', e);
        }
    },

    loadProjects() {
        try {
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
        } catch (e) {
            console.error('Error loading projects:', e);
        }
    },

    showModal(id) {
        try {
            const m = document.getElementById(id);
            if (m) {
                m.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        } catch (e) { console.error('showModal error:', e); }
    },

    closeModal(id) {
        try {
            const m = document.getElementById(id);
            if (m) {
                m.classList.remove('active');
                document.body.style.overflow = '';
            }
        } catch (e) { console.error('closeModal error:', e); }
    },

    toggleMobileMenu() {
        try {
            document.getElementById('mobileMenu')?.classList.toggle('active');
            document.querySelector('.mobile-menu-overlay')?.classList.toggle('active');
        } catch (e) { console.error('toggleMobileMenu error:', e); }
    },

    closeMobileMenu() {
        try {
            document.getElementById('mobileMenu')?.classList.remove('active');
            document.querySelector('.mobile-menu-overlay')?.classList.remove('active');
        } catch (e) { console.error('closeMobileMenu error:', e); }
    },

    toggleTheme() {
        try {
            const t = DataStore.settings.get().theme === 'light' ? 'dark' : 'light';
            DataStore.settings.setTheme(t);
            this.applyTheme();
        } catch (e) {
            console.error('toggleTheme error:', e);
        }
    },

    applyTheme() {
        try {
            const t = DataStore.settings.get().theme;
            document.documentElement.setAttribute('data-theme', t);
            document.querySelectorAll('.theme-toggle').forEach(el => el.classList.toggle('dark', t === 'dark'));
        } catch (e) {
            console.error('applyTheme error:', e);
        }
    },

    showToast(msg, type = 'info') {
        try {
            const c = document.getElementById('toastContainer');
            if (!c) return;
            const t = document.createElement('div');
            t.className = 'toast toast-' + type;
            t.innerHTML = `<span class="toast-message">${msg}</span><button class="toast-close" onclick="this.parentElement.remove()">×</button>`;
            c.appendChild(t);
            setTimeout(() => {
                t.classList.add('fade-out');
                setTimeout(() => t.remove(), 300);
            }, 4000);
        } catch (e) {
            console.error('showToast error:', e);
        }
    },

    getInitials(name) {
        try {
            return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
        } catch (e) {
            return '??';
        }
    },

    switchDocTab(tab) {
        try {
            document.querySelectorAll('.doc-tab').forEach(b => b.classList.toggle('active', b.dataset.docTab === tab));
            document.querySelectorAll('.doc-panel').forEach(p => p.classList.toggle('active', p.id === tab));
        } catch (e) {
            console.error('switchDocTab error:', e);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init().catch(err => {
        console.error('App init failed:', err);
        // Fallback: show login page
        try {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            const loginPage = document.getElementById('loginPage');
            if (loginPage) loginPage.classList.add('active');
        } catch (e) {
            console.error('Fallback failed:', e);
        }
    });
});

function doCustomerLogin() { App.doCustomerLogin(); }
function doVendorLogin() { App.doVendorLogin(); }
function switchLoginTab(tab) { App.switchLoginTab(tab); }
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
    try {
        const session = DataStore.session.get();
        let customer = null;
        if (session?.type === 'customer') {
            const user = DataStore.users.getById(session.userId);
            customer = DataStore.customers.getAll().find(c => c.phone === user?.phone);
        } else {
            customer = DataStore.customers.getAll()[0];
        }
        if (customer) Charts.setChartPeriod(period, customer.id);
    } catch (e) {
        console.error('setChartPeriod error:', e);
    }
}
function navigateToSection(page, section) { App.navigateToSection(section); }
