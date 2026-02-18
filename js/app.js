// Bhaskar Solar Platform - Main Application JavaScript

// State Management
let currentUser = null;
let currentUserType = null;
let applicationCodes = JSON.parse(localStorage.getItem('applicationCodes')) || [];
let chatMessages = {};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize login tabs
    initLoginTabs();

    // Initialize navigation
    initNavigation();

    // Initialize document tabs
    initDocTabs();

    // Initialize theme
    initTheme();

    // Load saved application codes
    loadApplicationCodes();

    // Initialize production chart
    renderProductionChart();

    // Initialize chat
    initChat();

    // Initialize calculators
    initCalculators();

    // Check for saved session
    checkSession();
}

// Session Management
function checkSession() {
    const savedUser = localStorage.getItem('currentUser');
    const savedUserType = localStorage.getItem('currentUserType');

    if (savedUser && savedUserType) {
        currentUser = JSON.parse(savedUser);
        currentUserType = savedUserType;

        if (currentUserType === 'customer') {
            showPage('customerDashboard');
            updateCustomerDashboard();
        } else {
            showPage('vendorDashboard');
            updateVendorDashboard();
        }
    }
}

function saveSession() {
    if (currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('currentUserType', currentUserType);
    }
}

function clearSession() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserType');
    currentUser = null;
    currentUserType = null;
}

// Login Tab Switching
function initLoginTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;

            // Update active tab button
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Show corresponding form
            document.querySelectorAll('.login-form').forEach(f => f.classList.remove('active'));
            document.getElementById(tab + 'Login').classList.add('active');
        });
    });
}

// Navigation
function initNavigation() {
    // Desktop nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.dataset.section;
            navigateToSection(getCurrentDashboard(), section, []);
        });
    });

    // Bottom nav (mobile)
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;

            // Update active state
            document.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            navigateToSection(getCurrentDashboard(), section, []);
        });
    });
}

function getCurrentDashboard() {
    const customerDash = document.getElementById('customerDashboard');
    const vendorDash = document.getElementById('vendorDashboard');

    if (customerDash && customerDash.classList.contains('active')) {
        return 'customerDashboard';
    } else if (vendorDash && vendorDash.classList.contains('active')) {
        return 'vendorDashboard';
    }
    return null;
}

function navigateToSection(dashboardId, sectionId, params) {
    // Hide all sections in the dashboard
    const dashboard = document.getElementById(dashboardId);
    if (!dashboard) return;

    dashboard.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionId);
    });

    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === sectionId);
    });

    // Close mobile menu if open
    closeMobileMenu();
}

// Page Management
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
}

// Customer Login
function doCustomerLogin() {
    const code = document.getElementById('customerCode').value.trim().toUpperCase();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();

    // Validation
    if (!code) {
        showToast('Please enter your application code', 'error');
        return;
    }
    if (!phone || phone.length !== 10) {
        showToast('Please enter a valid 10-digit phone number', 'error');
        return;
    }
    if (!address) {
        showToast('Please enter your site address', 'error');
        return;
    }

    // Check if code exists or create mock user
    let user = applicationCodes.find(c => c.code === code);

    if (!user) {
        // Create new user with this code (demo mode)
        user = {
            code: code,
            phone: phone,
            address: address,
            name: 'Customer',
            createdAt: new Date().toISOString(),
            status: 'Active'
        };
        applicationCodes.push(user);
        saveApplicationCodes();
    }

    currentUser = user;
    currentUserType = 'customer';
    saveSession();

    showToast('Login successful!', 'success');
    showPage('customerDashboard');
    updateCustomerDashboard();
}

// Vendor Login
function doVendorLogin() {
    const vendorId = document.getElementById('vendorId').value.trim();
    const phone = document.getElementById('vendorPhone').value.trim();
    const code = document.getElementById('vendorCode').value.trim();

    // Validation
    if (!vendorId) {
        showToast('Please enter your vendor ID', 'error');
        return;
    }
    if (!phone || phone.length !== 10) {
        showToast('Please enter a valid 10-digit phone number', 'error');
        return;
    }
    if (!code) {
        showToast('Please enter your access code', 'error');
        return;
    }

    // Demo: Accept any vendor login
    currentUser = {
        id: vendorId,
        phone: phone,
        name: 'Vendor',
        company: 'Solar Solutions'
    };
    currentUserType = 'vendor';
    saveSession();

    showToast('Vendor login successful!', 'success');
    showPage('vendorDashboard');
    updateVendorDashboard();
}

// Logout
function logout() {
    clearSession();
    showPage('loginPage');

    // Clear form inputs
    document.getElementById('customerCode').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerAddress').value = '';
    document.getElementById('vendorId').value = '';
    document.getElementById('vendorPhone').value = '';
    document.getElementById('vendorCode').value = '';

    showToast('Logged out successfully', 'info');
    closeMobileMenu();
}

// Update Dashboards
function updateCustomerDashboard() {
    if (!currentUser) return;

    // Update customer name
    const nameElements = document.querySelectorAll('#customerName, #mobileUserName');
    nameElements.forEach(el => {
        if (el) el.textContent = currentUser.name || 'Customer';
    });

    // Update application code display
    const codeElement = document.getElementById('customerAppCode');
    if (codeElement) {
        codeElement.textContent = currentUser.code || 'BSV-2024-0001';
    }

    // Update mobile menu initials
    const initialsEl = document.getElementById('mobileUserInitials');
    if (initialsEl && currentUser.name) {
        initialsEl.textContent = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
}

function updateVendorDashboard() {
    if (!currentUser) return;

    // Update vendor name displays
    const nameElements = document.querySelectorAll('#vendorName, #mobileUserName');
    nameElements.forEach(el => {
        if (el) el.textContent = currentUser.name || currentUser.company || 'Vendor';
    });

    // Update mobile menu initials
    const initialsEl = document.getElementById('mobileUserInitials');
    if (initialsEl) {
        const name = currentUser.name || currentUser.company || 'Vendor';
        initialsEl.textContent = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
}

// Mobile Menu
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    const overlay = document.querySelector('.mobile-menu-overlay');

    if (menu) menu.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

function closeMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    const overlay = document.querySelector('.mobile-menu-overlay');

    if (menu) menu.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Document Tabs
function initDocTabs() {
    document.querySelectorAll('.doc-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.docTab;

            // Update active tab
            document.querySelectorAll('.doc-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Show corresponding panel
            document.querySelectorAll('.doc-panel').forEach(p => p.classList.remove('active'));
            const panel = document.getElementById(tabId);
            if (panel) panel.classList.add('active');
        });
    });
}

// Production Chart
function renderProductionChart() {
    const chartArea = document.getElementById('productionChartArea');
    const chartLabels = document.getElementById('chartLabels');

    if (!chartArea || !chartLabels) return;

    // Sample data for the week
    const data = [8.2, 12.5, 15.3, 11.8, 14.2, 16.1, 13.7];
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const maxValue = Math.max(...data);

    chartArea.innerHTML = '';
    chartLabels.innerHTML = '';

    data.forEach((value, index) => {
        const height = (value / maxValue) * 100;
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = height + '%';
        bar.setAttribute('data-value', value + ' kWh');
        chartArea.appendChild(bar);

        const label = document.createElement('span');
        label.textContent = labels[index];
        chartLabels.appendChild(label);
    });
}

function setChartPeriod(period) {
    // Update active button
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Re-render chart with different data (demo)
    renderProductionChart();
    showToast('Showing ' + period + ' data', 'info');
}

// Toast Notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            ${type === 'success' ? '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>' :
              type === 'error' ? '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>' :
              '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>'}
        </svg>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Modal Management
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Application Code Management
function loadApplicationCodes() {
    const saved = localStorage.getItem('applicationCodes');
    if (saved) {
        applicationCodes = JSON.parse(saved);
    }
}

function saveApplicationCodes() {
    localStorage.setItem('applicationCodes', JSON.stringify(applicationCodes));
}

function generateApplicationCode(event) {
    event.preventDefault();

    const customerName = document.getElementById('codeCustomerName').value.trim();
    const customerPhone = document.getElementById('codeCustomerPhone').value.trim();
    const siteAddress = document.getElementById('codeSiteAddress').value.trim();
    const projectType = document.getElementById('codeProjectType').value;
    const systemSize = document.getElementById('codeSystemSize').value;

    // Generate new code
    const year = new Date().getFullYear();
    const existingCodes = applicationCodes.filter(c => c.code.startsWith('BSV-' + year));
    const nextNum = (existingCodes.length + 1).toString().padStart(4, '0');
    const newCode = `BSV-${year}-${nextNum}`;

    // Create entry
    const entry = {
        code: newCode,
        name: customerName || 'Not Assigned',
        phone: customerPhone || '-',
        address: siteAddress,
        projectType: projectType,
        systemSize: systemSize,
        createdAt: new Date().toISOString(),
        status: customerPhone ? 'Active' : 'Pending'
    };

    applicationCodes.push(entry);
    saveApplicationCodes();

    // Update display
    document.getElementById('successCodeDisplay').textContent = newCode;

    // Show success modal
    closeModal('generateCodeModal');
    showModal('codeSuccessModal');

    showToast('Application code generated successfully!', 'success');
}

function copyCodeToClipboard() {
    const code = document.getElementById('successCodeDisplay').textContent;
    navigator.clipboard.writeText(code).then(() => {
        showToast('Code copied to clipboard!', 'success');
    });
}

function shareCodeViaWhatsApp() {
    const code = document.getElementById('successCodeDisplay').textContent;
    const message = encodeURIComponent(`Your Bhaskar Solar application code is: ${code}\n\nUse this code to login and track your solar installation at our portal.`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
}

function shareCodeViaSMS() {
    const code = document.getElementById('successCodeDisplay').textContent;
    const message = encodeURIComponent(`Your Bhaskar Solar code: ${code}`);
    window.open(`sms:?body=${message}`, '_blank');
}

function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        showToast('Code copied!', 'success');
    });
}

function assignCode(code) {
    showToast('Assign functionality - Open customer form for ' + code, 'info');
}

// Support Form
function submitSupport(event) {
    event.preventDefault();

    const type = document.getElementById('supportType').value;
    const priority = document.getElementById('supportPriority').value;
    const description = document.getElementById('supportDescription').value;

    // Demo: Just show success
    closeModal('supportModal');
    showToast('Support request submitted! We will contact you soon.', 'success');

    // Reset form
    event.target.reset();
}

// Quotation Builder
function generateQuotation(event) {
    event.preventDefault();

    const systemSize = parseFloat(document.querySelector('#quotationModal input[placeholder="e.g., 6.5"]').value);
    const equipmentCost = parseFloat(document.getElementById('equipmentCost').value) || 0;
    const installationCost = parseFloat(document.getElementById('installationCost').value) || 0;

    const total = equipmentCost + installationCost;

    closeModal('quotationModal');
    showToast(`Quotation generated! Total: ₹${total.toLocaleString()}`, 'success');
}

// Calculator Functions
function initCalculators() {
    // Calculator event listeners are set inline in HTML
}

function calculateSystemSize() {
    const monthlyBill = parseFloat(document.getElementById('vendorMonthlyBill').value);
    const resultEl = document.getElementById('systemSizeResult');

    if (!monthlyBill || monthlyBill <= 0) {
        resultEl.innerHTML = '<span style="color: var(--danger);">Please enter a valid bill amount</span>';
        return;
    }

    // Rough calculation: ₹6 per kWh, 120 kWh per kW per month
    const monthlyUnits = monthlyBill / 6;
    const systemSize = (monthlyUnits / 120).toFixed(1);

    resultEl.innerHTML = `
        <div style="font-size: 1.2rem; color: var(--success);">
            Recommended: <strong>${systemSize} kW</strong> System
        </div>
        <div style="font-size: 0.85rem; color: var(--gray); margin-top: 5px;">
            Estimated ${Math.round(systemSize * 4)} panels needed
        </div>
    `;
}

function calculateROI() {
    const systemCost = parseFloat(document.getElementById('systemCost').value);
    const annualSavings = parseFloat(document.getElementById('annualSavings').value);
    const resultEl = document.getElementById('roiResult');

    if (!systemCost || !annualSavings || systemCost <= 0 || annualSavings <= 0) {
        resultEl.innerHTML = '<span style="color: var(--danger);">Please enter valid values</span>';
        return;
    }

    const paybackYears = (systemCost / annualSavings).toFixed(1);
    const lifetimeSavings = (annualSavings * 25) - systemCost;

    resultEl.innerHTML = `
        <div style="font-size: 1.2rem; color: var(--success);">
            Payback: <strong>${paybackYears} years</strong>
        </div>
        <div style="font-size: 0.85rem; color: var(--gray); margin-top: 5px;">
            25-year savings: ₹${lifetimeSavings.toLocaleString()}
        </div>
    `;
}

// Chat Functionality
function initChat() {
    // Sample contacts
    const contacts = [
        { id: 1, name: 'Support Team', avatar: 'ST', lastMessage: 'How can we help you?' },
        { id: 2, name: 'Technical Team', avatar: 'TT', lastMessage: 'Your query is being processed' }
    ];

    const chatList = document.querySelector('.chat-list');
    if (!chatList) return;

    chatList.innerHTML = contacts.map(contact => `
        <div class="chat-item" onclick="selectChat(${contact.id})">
            <div class="contact-avatar">${contact.avatar}</div>
            <div class="chat-preview">
                <div class="chat-preview-name">${contact.name}</div>
                <div class="chat-preview-text">${contact.lastMessage}</div>
            </div>
        </div>
    `).join('');

    // Initialize chat input
    const chatInputBtn = document.querySelector('.chat-input button');
    const chatInputField = document.querySelector('.chat-input input');

    if (chatInputBtn && chatInputField) {
        chatInputBtn.addEventListener('click', sendMessage);
        chatInputField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

function selectChat(contactId) {
    // Update active chat
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Load chat messages (demo)
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML = `
            <div class="message">
                <div class="message-bubble">Hello! How can we help you with your solar installation?</div>
                <div class="message-time">10:30 AM</div>
            </div>
            <div class="message sent">
                <div class="message-bubble">I have a question about my application status.</div>
                <div class="message-time">10:32 AM</div>
            </div>
            <div class="message">
                <div class="message-bubble">Sure! Let me check that for you. Your application is currently under review.</div>
                <div class="message-time">10:33 AM</div>
            </div>
        `;
    }
}

function sendMessage() {
    const input = document.querySelector('.chat-input input');
    const message = input.value.trim();

    if (!message) return;

    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
        const msgEl = document.createElement('div');
        msgEl.className = 'message sent';
        msgEl.innerHTML = `
            <div class="message-bubble">${message}</div>
            <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        `;
        chatMessages.appendChild(msgEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    input.value = '';

    // Simulate response
    setTimeout(() => {
        const responseEl = document.createElement('div');
        responseEl.className = 'message';
        responseEl.innerHTML = `
            <div class="message-bubble">Thank you for your message. Our team will respond shortly.</div>
            <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        `;
        chatMessages.appendChild(responseEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1000);
}

// FAB Quick Actions
function toggleQuickActions() {
    showToast('Quick actions menu - Add new item', 'info');
}

// Search Functionality
function initSearch() {
    const productionSearch = document.getElementById('productionSearch');
    const codeSearchInput = document.getElementById('codeSearchInput');

    if (productionSearch) {
        productionSearch.addEventListener('input', function() {
            // Filter production data (demo)
            showToast('Searching: ' + this.value, 'info');
        });
    }

    if (codeSearchInput) {
        codeSearchInput.addEventListener('input', function() {
            // Filter codes table (demo)
            const searchTerm = this.value.toLowerCase();
            document.querySelectorAll('.data-table tbody tr').forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
}

// Initialize search on load
document.addEventListener('DOMContentLoaded', initSearch);

// Service Worker Registration (for PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Service worker registration disabled for static hosting
        console.log('Bhaskar Solar Platform loaded');
    });
}
