// State
let user = null, userType = null, codes = JSON.parse(localStorage.getItem('codes')) || [];

// Init
document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
        document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
        document.querySelectorAll('.form').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        document.getElementById(t.dataset.tab + 'Form').classList.add('active');
    });

    // Navigation
    document.querySelectorAll('.nav-link').forEach(l => l.onclick = () => {
        document.querySelectorAll('.nav-link').forEach(x => x.classList.remove('active'));
        document.querySelectorAll('.section').forEach(x => x.classList.remove('active'));
        l.classList.add('active');
        document.getElementById(l.dataset.section).classList.add('active');
    });

    // Forms
    document.getElementById('customerForm').onsubmit = e => {
        e.preventDefault();
        const code = document.getElementById('custCode').value.trim().toUpperCase();
        const phone = document.getElementById('custPhone').value.trim();
        const addr = document.getElementById('custAddress').value.trim();
        if (!code || phone.length !== 10 || !addr) return toast('Fill all fields correctly', 'error');
        user = { code, phone, addr, name: 'Customer' };
        userType = 'customer';
        save();
        showPage('customerDash');
        toast('Welcome!', 'success');
    };

    document.getElementById('vendorForm').onsubmit = e => {
        e.preventDefault();
        const vid = document.getElementById('vendId').value.trim();
        const phone = document.getElementById('vendPhone').value.trim();
        const code = document.getElementById('vendCode').value.trim();
        if (!vid || phone.length !== 10 || !code) return toast('Fill all fields correctly', 'error');
        user = { id: vid, phone, name: vid };
        userType = 'vendor';
        save();
        showPage('vendorDash');
        loadCodes();
        toast('Welcome!', 'success');
    };

    // Check session
    const saved = localStorage.getItem('user');
    const savedType = localStorage.getItem('userType');
    if (saved && savedType) {
        user = JSON.parse(saved);
        userType = savedType;
        showPage(userType === 'customer' ? 'customerDash' : 'vendorDash');
        if (userType === 'customer') {
            document.getElementById('appCode').textContent = user.code;
        } else {
            loadCodes();
        }
    }

    // Render chart
    renderChart();
});

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    user = null; userType = null;
    showPage('loginPage');
    toast('Logged out', 'success');
}

function save() {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userType', userType);
}

function toast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    document.getElementById('toast').appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

// Chat
function sendMessage() {
    const input = document.getElementById('msgInput');
    const msg = input.value.trim();
    if (!msg) return;
    const box = document.getElementById('chatBox');
    const m = document.createElement('div');
    m.className = 'msg sent';
    m.textContent = msg;
    box.appendChild(m);
    input.value = '';
    box.scrollTop = box.scrollHeight;
    setTimeout(() => {
        const r = document.createElement('div');
        r.className = 'msg received';
        r.textContent = 'Thank you! We will respond shortly.';
        box.appendChild(r);
        box.scrollTop = box.scrollHeight;
    }, 1000);
}

// Code Generation
function showCodeGen() {
    document.getElementById('codeModal').classList.add('active');
}

function closeModal() {
    document.getElementById('codeModal').classList.remove('active');
}

function genCode() {
    const name = document.getElementById('newCustName').value.trim();
    const phone = document.getElementById('newCustPhone').value.trim();
    const year = new Date().getFullYear();
    const num = (codes.length + 1).toString().padStart(4, '0');
    const code = `BSV-${year}-${num}`;
    codes.push({ code, name: name || 'Unknown', phone, date: new Date().toISOString() });
    localStorage.setItem('codes', JSON.stringify(codes));
    document.getElementById('genCodeDisplay').textContent = code;
    loadCodes();
    toast('Code generated!', 'success');
}

function loadCodes() {
    const list = document.getElementById('codeList');
    list.innerHTML = codes.map(c => `<div class="code-item"><span>${c.code}</span><span>${c.name}</span></div>`).join('') || '<p>No codes yet</p>';
}

// Chart
function renderChart() {
    const chart = document.getElementById('chart');
    if (!chart) return;
    const data = [8, 12, 15, 11, 14, 16, 13];
    const max = Math.max(...data);
    chart.innerHTML = data.map(v => `<div class="chart-bar" style="height:${(v/max)*100}%"></div>`).join('');
}

// Calculators
function calcSystem() {
    const bill = parseFloat(document.getElementById('monthlyBill').value);
    if (!bill) return;
    const units = bill / 6;
    const size = (units / 120).toFixed(1);
    document.getElementById('calcResult').textContent = `Recommended: ${size} kW system (${Math.round(size*4)} panels)`;
}

function calcROI() {
    const cost = parseFloat(document.getElementById('sysCost').value);
    const savings = parseFloat(document.getElementById('annSavings').value);
    if (!cost || !savings) return;
    const years = (cost / savings).toFixed(1);
    document.getElementById('roiResult').textContent = `Payback: ${years} years | 25yr savings: ₹${((savings*25)-cost).toLocaleString()}`;
}
