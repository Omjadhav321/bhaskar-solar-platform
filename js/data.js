/**
 * Bhaskar Solar Platform - Data Management Module
 * Uses UniversalStorage for cross-browser compatibility
 * Works on Chrome, Safari, Firefox, Edge, and all mobile browsers
 */

const DataStore = {
    // Storage Keys
    KEYS: {
        USERS: 'bs_users',
        CUSTOMERS: 'bs_customers',
        APP_CODES: 'bs_app_codes',
        DOCUMENTS: 'bs_documents',
        MESSAGES: 'bs_messages',
        PRODUCTION: 'bs_production',
        SESSION: 'bs_session',
        SETTINGS: 'bs_settings'
    },

    // Memory cache for synchronous access
    cache: {},
    initialized: false,

    // Initialize - loads data into memory cache
    async init() {
        console.log('DataStore: Initializing...');

        try {
            // Wait for UniversalStorage to be ready
            await UniversalStorage.onReady();
        } catch (e) {
            console.warn('UniversalStorage not ready, continuing with fallback:', e);
        }

        // Load all data into memory cache
        for (const key of Object.values(this.KEYS)) {
            try {
                const data = await UniversalStorage.get(key);
                this.cache[key] = data;
            } catch (e) {
                console.warn('Could not load key from storage:', key, e);
                this.cache[key] = null;
            }
        }

        // Initialize empty arrays for missing data
        if (!this.cache[this.KEYS.USERS]) {
            this.cache[this.KEYS.USERS] = [];
            try { await this.save(this.KEYS.USERS); } catch (e) { console.warn('Could not save USERS:', e); }
        }
        if (!this.cache[this.KEYS.CUSTOMERS]) {
            this.cache[this.KEYS.CUSTOMERS] = [];
            try { await this.save(this.KEYS.CUSTOMERS); } catch (e) { console.warn('Could not save CUSTOMERS:', e); }
        }
        if (!this.cache[this.KEYS.APP_CODES]) {
            this.cache[this.KEYS.APP_CODES] = [];
            try { await this.save(this.KEYS.APP_CODES); } catch (e) { console.warn('Could not save APP_CODES:', e); }
        }
        if (!this.cache[this.KEYS.DOCUMENTS]) {
            this.cache[this.KEYS.DOCUMENTS] = [];
            try { await this.save(this.KEYS.DOCUMENTS); } catch (e) { console.warn('Could not save DOCUMENTS:', e); }
        }
        if (!this.cache[this.KEYS.MESSAGES]) {
            this.cache[this.KEYS.MESSAGES] = [];
            try { await this.save(this.KEYS.MESSAGES); } catch (e) { console.warn('Could not save MESSAGES:', e); }
        }
        if (!this.cache[this.KEYS.PRODUCTION]) {
            this.cache[this.KEYS.PRODUCTION] = [];
            try { await this.save(this.KEYS.PRODUCTION); } catch (e) { console.warn('Could not save PRODUCTION:', e); }
        }
        if (!this.cache[this.KEYS.SETTINGS]) {
            this.cache[this.KEYS.SETTINGS] = { theme: 'light' };
            try { await this.save(this.KEYS.SETTINGS); } catch (e) { console.warn('Could not save SETTINGS:', e); }
        }

        // Load session from localStorage for immediate access
        try {
            const sessionData = localStorage.getItem('bs_session');
            if (sessionData) {
                this.cache[this.KEYS.SESSION] = JSON.parse(sessionData);
            }
        } catch (e) {
            console.warn('Could not load session from localStorage:', e);
        }

        this.initialized = true;
        console.log('DataStore: Initialized. Users:', this.cache[this.KEYS.USERS]);
        console.log('DataStore: Ready');
    },

    // Sync get from cache
    get(key) {
        return this.cache[key] !== undefined ? this.cache[key] : null;
    },

    // Sync set to cache (and async save to storage)
    set(key, value) {
        this.cache[key] = value;
        // Save asynchronously
        UniversalStorage.set(key, value).catch(e =>
            console.error('Failed to save', key, e)
        );
        return true;
    },

    // Force save to storage
    async save(key) {
        return await UniversalStorage.set(key, this.cache[key]);
    },

    // Remove data
    remove(key) {
        delete this.cache[key];
        UniversalStorage.remove(key).catch(e =>
            console.error('Failed to remove', key, e)
        );
        return true;
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Generate Application Code
    generateAppCode() {
        const year = new Date().getFullYear();
        const existingCodes = this.cache[this.KEYS.APP_CODES] || [];
        const yearCodes = existingCodes.filter(c => c.code && c.code.includes(`BSV-${year}`));
        const nextNum = (yearCodes.length + 1).toString().padStart(4, '0');
        return `BSV-${year}-${nextNum}`;
    },

    // User Operations
    users: {
        getAll() {
            return DataStore.cache[DataStore.KEYS.USERS] || [];
        },

        getById(id) {
            const users = DataStore.cache[DataStore.KEYS.USERS] || [];
            return users.find(u => u.id === id);
        },

        getByPhone(phone) {
            const users = DataStore.cache[DataStore.KEYS.USERS] || [];
            return users.find(u => u.phone === phone);
        },

        getByType(type) {
            const users = DataStore.cache[DataStore.KEYS.USERS] || [];
            return users.filter(u => u.type === type);
        },

        create(userData) {
            const users = DataStore.cache[DataStore.KEYS.USERS] || [];
            const newUser = {
                id: DataStore.generateId(),
                ...userData,
                createdAt: new Date().toISOString()
            };
            users.push(newUser);
            DataStore.set(DataStore.KEYS.USERS, users);
            console.log('User created:', newUser);
            return newUser;
        },

        update(id, updates) {
            const users = DataStore.cache[DataStore.KEYS.USERS] || [];
            const index = users.findIndex(u => u.id === id);
            if (index !== -1) {
                users[index] = { ...users[index], ...updates, updatedAt: new Date().toISOString() };
                DataStore.set(DataStore.KEYS.USERS, users);
                return users[index];
            }
            return null;
        },

        delete(id) {
            const users = DataStore.cache[DataStore.KEYS.USERS] || [];
            const filtered = users.filter(u => u.id !== id);
            DataStore.set(DataStore.KEYS.USERS, filtered);
            return true;
        },

        validateLogin(phone, password, type) {
            const users = DataStore.cache[DataStore.KEYS.USERS] || [];
            return users.find(u => u.phone === phone && u.password === password && u.type === type);
        }
    },

    // Customer Operations
    customers: {
        getAll() {
            return DataStore.cache[DataStore.KEYS.CUSTOMERS] || [];
        },

        getById(id) {
            const customers = DataStore.cache[DataStore.KEYS.CUSTOMERS] || [];
            return customers.find(c => c.id === id);
        },

        getByVendor(vendorId) {
            const customers = DataStore.cache[DataStore.KEYS.CUSTOMERS] || [];
            return customers.filter(c => c.vendorId === vendorId);
        },

        getByAppCode(appCode) {
            const customers = DataStore.cache[DataStore.KEYS.CUSTOMERS] || [];
            return customers.find(c => c.appCode === appCode);
        },

        create(customerData) {
            const customers = DataStore.cache[DataStore.KEYS.CUSTOMERS] || [];
            const appCode = DataStore.generateAppCode();

            // Create app code record
            const appCodes = DataStore.cache[DataStore.KEYS.APP_CODES] || [];
            appCodes.push({
                code: appCode,
                customerId: null,
                vendorId: customerData.vendorId,
                status: 'pending',
                createdAt: new Date().toISOString()
            });
            DataStore.set(DataStore.KEYS.APP_CODES, appCodes);

            const newCustomer = {
                id: DataStore.generateId(),
                appCode,
                ...customerData,
                status: 'pending',
                systemCapacity: customerData.systemCapacity || 0,
                panels: customerData.panels || 0,
                panelRating: customerData.panelRating || 400,
                createdAt: new Date().toISOString()
            };
            customers.push(newCustomer);
            DataStore.set(DataStore.KEYS.CUSTOMERS, customers);

            // Update app code with customer ID
            const codes = DataStore.cache[DataStore.KEYS.APP_CODES] || [];
            const codeIndex = codes.findIndex(c => c.code === appCode);
            if (codeIndex !== -1) {
                codes[codeIndex].customerId = newCustomer.id;
                DataStore.set(DataStore.KEYS.APP_CODES, codes);
            }

            return newCustomer;
        },

        update(id, updates) {
            const customers = DataStore.cache[DataStore.KEYS.CUSTOMERS] || [];
            const index = customers.findIndex(c => c.id === id);
            if (index !== -1) {
                customers[index] = { ...customers[index], ...updates, updatedAt: new Date().toISOString() };
                DataStore.set(DataStore.KEYS.CUSTOMERS, customers);
                return customers[index];
            }
            return null;
        },

        delete(id) {
            const customers = DataStore.cache[DataStore.KEYS.CUSTOMERS] || [];
            const filtered = customers.filter(c => c.id !== id);
            DataStore.set(DataStore.KEYS.CUSTOMERS, filtered);
            return true;
        },

        search(query, vendorId) {
            const customers = this.getByVendor(vendorId);
            const q = query.toLowerCase();
            return customers.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.phone.includes(q) ||
                c.appCode.toLowerCase().includes(q) ||
                (c.address && c.address.toLowerCase().includes(q))
            );
        }
    },

    // Application Code Operations
    appCodes: {
        getAll() {
            return DataStore.cache[DataStore.KEYS.APP_CODES] || [];
        },

        getByCode(code) {
            const codes = DataStore.cache[DataStore.KEYS.APP_CODES] || [];
            return codes.find(c => c.code === code);
        },

        getByVendor(vendorId) {
            const codes = DataStore.cache[DataStore.KEYS.APP_CODES] || [];
            return codes.filter(c => c.vendorId === vendorId);
        },

        updateStatus(code, status) {
            const codes = DataStore.cache[DataStore.KEYS.APP_CODES] || [];
            const index = codes.findIndex(c => c.code === code);
            if (index !== -1) {
                codes[index].status = status;
                codes[index].updatedAt = new Date().toISOString();
                DataStore.set(DataStore.KEYS.APP_CODES, codes);
                return codes[index];
            }
            return null;
        }
    },

    // Document Operations
    documents: {
        getAll() {
            return DataStore.cache[DataStore.KEYS.DOCUMENTS] || [];
        },

        getById(id) {
            const docs = DataStore.cache[DataStore.KEYS.DOCUMENTS] || [];
            return docs.find(d => d.id === id);
        },

        getByCustomer(customerId) {
            const docs = DataStore.cache[DataStore.KEYS.DOCUMENTS] || [];
            return docs.filter(d => d.customerId === customerId);
        },

        getByType(customerId, type) {
            const docs = this.getByCustomer(customerId);
            return docs.filter(d => d.type === type);
        },

        create(docData) {
            const docs = DataStore.cache[DataStore.KEYS.DOCUMENTS] || [];
            const newDoc = {
                id: DataStore.generateId(),
                ...docData,
                createdAt: new Date().toISOString()
            };
            docs.push(newDoc);
            DataStore.set(DataStore.KEYS.DOCUMENTS, docs);
            return newDoc;
        },

        delete(id) {
            const docs = DataStore.cache[DataStore.KEYS.DOCUMENTS] || [];
            const filtered = docs.filter(d => d.id !== id);
            DataStore.set(DataStore.KEYS.DOCUMENTS, filtered);
            return true;
        },

        getStorageUsed() {
            const docs = this.getAll();
            let total = 0;
            docs.forEach(d => {
                if (d.data) {
                    total += d.data.length * 0.75;
                }
            });
            return total;
        }
    },

    // Message Operations
    messages: {
        getAll() {
            return DataStore.cache[DataStore.KEYS.MESSAGES] || [];
        },

        getConversation(userId1, userId2) {
            const messages = DataStore.cache[DataStore.KEYS.MESSAGES] || [];
            return messages.filter(m =>
                (m.fromUserId === userId1 && m.toUserId === userId2) ||
                (m.fromUserId === userId2 && m.toUserId === userId1)
            ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        },

        getUserConversations(userId) {
            const messages = DataStore.cache[DataStore.KEYS.MESSAGES] || [];
            const conversationPartners = new Set();

            messages.forEach(m => {
                if (m.fromUserId === userId) conversationPartners.add(m.toUserId);
                if (m.toUserId === userId) conversationPartners.add(m.fromUserId);
            });

            return Array.from(conversationPartners);
        },

        send(fromUserId, toUserId, text) {
            const messages = DataStore.cache[DataStore.KEYS.MESSAGES] || [];
            const newMessage = {
                id: DataStore.generateId(),
                fromUserId,
                toUserId,
                text,
                timestamp: new Date().toISOString(),
                read: false
            };
            messages.push(newMessage);
            DataStore.set(DataStore.KEYS.MESSAGES, messages);
            return newMessage;
        },

        markAsRead(messageIds) {
            const messages = DataStore.cache[DataStore.KEYS.MESSAGES] || [];
            messageIds.forEach(id => {
                const index = messages.findIndex(m => m.id === id);
                if (index !== -1) {
                    messages[index].read = true;
                }
            });
            DataStore.set(DataStore.KEYS.MESSAGES, messages);
        },

        getUnreadCount(userId) {
            const messages = DataStore.cache[DataStore.KEYS.MESSAGES] || [];
            return messages.filter(m => m.toUserId === userId && !m.read).length;
        }
    },

    // Production Data Operations
    production: {
        getAll() {
            return DataStore.cache[DataStore.KEYS.PRODUCTION] || [];
        },

        getByCustomer(customerId) {
            const data = DataStore.cache[DataStore.KEYS.PRODUCTION] || [];
            return data.filter(p => p.customerId === customerId);
        },

        getToday(customerId) {
            const today = new Date().toISOString().split('T')[0];
            const data = this.getByCustomer(customerId);
            return data.find(p => p.date === today);
        },

        generateDailyData(customerId, systemCapacity) {
            const today = new Date().toISOString().split('T')[0];
            const existing = this.getToday(customerId);

            if (existing) return existing;

            const hourlyData = [];
            const baseOutput = systemCapacity * 0.85;

            for (let hour = 5; hour <= 19; hour++) {
                const sunFactor = Math.sin((hour - 5) * Math.PI / 14);
                const weatherFactor = 0.8 + Math.random() * 0.4;
                const output = baseOutput * sunFactor * weatherFactor * (1/24);

                hourlyData.push({
                    hour,
                    output: Math.round(output * 100) / 100
                });
            }

            const dailyTotal = hourlyData.reduce((sum, h) => sum + h.output, 0);

            const newEntry = {
                id: DataStore.generateId(),
                customerId,
                date: today,
                hourlyData,
                dailyTotal: Math.round(dailyTotal * 100) / 100,
                efficiency: Math.round((dailyTotal / (systemCapacity * 5)) * 100),
                createdAt: new Date().toISOString()
            };

            const production = DataStore.cache[DataStore.KEYS.PRODUCTION] || [];
            production.push(newEntry);
            DataStore.set(DataStore.KEYS.PRODUCTION, production);

            return newEntry;
        },

        getWeeklyData(customerId) {
            const data = this.getByCustomer(customerId);
            const weekData = [];

            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const dayData = data.find(d => d.date === dateStr);

                weekData.push({
                    date: dateStr,
                    dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    total: dayData ? dayData.dailyTotal : 0
                });
            }

            return weekData;
        },

        getMonthlyData(customerId) {
            const data = this.getByCustomer(customerId);
            const monthData = [];

            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const dayData = data.find(d => d.date === dateStr);

                monthData.push({
                    date: dateStr,
                    total: dayData ? dayData.dailyTotal : 0
                });
            }

            return monthData;
        },

        getStats(customerId) {
            const data = this.getByCustomer(customerId);
            const today = this.getToday(customerId);

            const thisMonth = data.filter(p => {
                const date = new Date(p.date);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            });

            const totalThisMonth = thisMonth.reduce((sum, p) => sum + p.dailyTotal, 0);
            const totalAllTime = data.reduce((sum, p) => sum + p.dailyTotal, 0);
            const co2Saved = totalAllTime * 0.85;

            return {
                today: today ? today.dailyTotal : 0,
                thisMonth: Math.round(totalThisMonth * 10) / 10,
                allTime: Math.round(totalAllTime * 10) / 10,
                efficiency: today ? today.efficiency : 0,
                co2Saved: Math.round(co2Saved)
            };
        }
    },

    // Session Management
    session: {
        login(user) {
            try {
                console.log('Creating session for user:', user?.name);
                const session = {
                    userId: user.id,
                    type: user.type,
                    name: user.name,
                    phone: user.phone,
                    loginTime: new Date().toISOString()
                };
                DataStore.set(DataStore.KEYS.SESSION, session);
                // Also save directly to localStorage for immediate access
                try {
                    localStorage.setItem('bs_session', JSON.stringify(session));
                } catch (e) {
                    console.warn('Could not save session to localStorage:', e);
                }
                console.log('Session saved:', session);
                return session;
            } catch (e) {
                console.error('Error creating session:', e);
                return null;
            }
        },

        get() {
            try {
                let session = DataStore.cache[DataStore.KEYS.SESSION];
                if (!session) {
                    // Try loading from localStorage
                    const data = localStorage.getItem('bs_session');
                    if (data) {
                        session = JSON.parse(data);
                        DataStore.cache[DataStore.KEYS.SESSION] = session;
                    }
                }
                return session || null;
            } catch (e) {
                console.warn('Error getting session:', e);
                return null;
            }
        },

        isLoggedIn() {
            try {
                const session = this.get();
                return !!(session && session.userId);
            } catch (e) {
                return false;
            }
        },

        logout() {
            try {
                console.log('Logging out');
                DataStore.remove(DataStore.KEYS.SESSION);
                localStorage.removeItem('bs_session');
            } catch (e) {
                console.warn('Error during logout:', e);
                // Force clear from cache
                delete DataStore.cache[DataStore.KEYS.SESSION];
            }
        }
    },

    // Settings
    settings: {
        get() {
            return DataStore.cache[DataStore.KEYS.SETTINGS] || { theme: 'light' };
        },

        update(updates) {
            const settings = this.get();
            const newSettings = { ...settings, ...updates };
            DataStore.set(DataStore.KEYS.SETTINGS, newSettings);
            return newSettings;
        },

        setTheme(theme) {
            return this.update({ theme });
        }
    },

    // Clear all data
    clearAll() {
        this.cache = {};
        UniversalStorage.clearAll();
    },

    // Check if storage is available
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
};
