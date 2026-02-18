/**
 * Bhaskar Solar Platform - Universal Storage Module
 * Works on ALL browsers: Chrome, Safari, Firefox, Edge, Mobile
 * Uses IndexedDB with localStorage fallback
 */

const UniversalStorage = {
    dbName: 'BhaskarSolarDB',
    dbVersion: 1,
    db: null,
    isReady: false,
    readyCallbacks: [],

    // Initialize the storage system
    async init() {
        console.log('UniversalStorage: Initializing...');

        // Try IndexedDB first (works on all modern browsers including Safari)
        try {
            await this.initIndexedDB();
            console.log('UniversalStorage: IndexedDB initialized successfully');
        } catch (e) {
            console.warn('UniversalStorage: IndexedDB failed, using localStorage fallback:', e);
        }

        this.isReady = true;
        this.readyCallbacks.forEach(cb => cb());
        this.readyCallbacks = [];

        return true;
    },

    // Initialize IndexedDB
    initIndexedDB() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                reject('IndexedDB not supported');
                return;
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('IndexedDB error:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('IndexedDB opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object store for all data
                if (!db.objectStoreNames.contains('data')) {
                    db.createObjectStore('data', { keyPath: 'key' });
                    console.log('IndexedDB object store created');
                }
            };
        });
    },

    // Wait for storage to be ready - returns a promise
    onReady() {
        return new Promise((resolve) => {
            if (this.isReady) {
                resolve();
            } else {
                this.readyCallbacks.push(resolve);
            }
        });
    },

    // Legacy callback support
    onReadyCallback(callback) {
        if (this.isReady) {
            callback();
        } else {
            this.readyCallbacks.push(callback);
        }
    },

    // Save data (tries IndexedDB first, then localStorage)
    async set(key, value) {
        const data = JSON.stringify(value);
        console.log('UniversalStorage SET:', key);

        // Try IndexedDB first
        if (this.db) {
            try {
                await this.setIndexedDB(key, data);
                console.log('✓ Saved to IndexedDB:', key);
            } catch (e) {
                console.warn('IndexedDB save failed, trying localStorage:', e);
            }
        }

        // Also save to localStorage as backup
        try {
            localStorage.setItem(key, data);
            console.log('✓ Saved to localStorage:', key);
        } catch (e) {
            console.warn('localStorage save failed:', e);
        }

        // Verify save
        const saved = await this.get(key);
        if (saved !== null) {
            console.log('✓ Verified save for:', key);
            return true;
        } else {
            console.error('✗ Save verification failed for:', key);
            return false;
        }
    },

    // Get data (tries IndexedDB first, then localStorage)
    async get(key) {
        // Try IndexedDB first
        if (this.db) {
            try {
                const data = await this.getIndexedDB(key);
                if (data !== null && data !== undefined) {
                    console.log('✓ Got from IndexedDB:', key);
                    return JSON.parse(data);
                }
            } catch (e) {
                console.warn('IndexedDB get failed:', e);
            }
        }

        // Fallback to localStorage
        try {
            const data = localStorage.getItem(key);
            if (data !== null && data !== undefined && data !== '') {
                console.log('✓ Got from localStorage:', key);
                return JSON.parse(data);
            }
        } catch (e) {
            console.warn('localStorage get failed:', e);
        }

        return null;
    },

    // IndexedDB set
    setIndexedDB(key, value) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('DB not initialized');
                return;
            }

            const transaction = this.db.transaction(['data'], 'readwrite');
            const store = transaction.objectStore('data');
            const request = store.put({ key, value: value });

            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    // IndexedDB get
    getIndexedDB(key) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('DB not initialized');
                return;
            }

            const transaction = this.db.transaction(['data'], 'readonly');
            const store = transaction.objectStore('data');
            const request = store.get(key);

            request.onsuccess = (event) => {
                const result = event.target.result;
                resolve(result ? result.value : null);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    },

    // Remove data
    async remove(key) {
        // Remove from IndexedDB
        if (this.db) {
            try {
                const transaction = this.db.transaction(['data'], 'readwrite');
                const store = transaction.objectStore('data');
                store.delete(key);
            } catch (e) {
                console.warn('IndexedDB remove failed:', e);
            }
        }

        // Remove from localStorage
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('localStorage remove failed:', e);
        }

        return true;
    },

    // Clear all data
    async clearAll() {
        // Clear IndexedDB
        if (this.db) {
            try {
                const transaction = this.db.transaction(['data'], 'readwrite');
                const store = transaction.objectStore('data');
                store.clear();
            } catch (e) {
                console.warn('IndexedDB clear failed:', e);
            }
        }

        // Clear localStorage
        try {
            localStorage.clear();
        } catch (e) {
            console.warn('localStorage clear failed:', e);
        }

        return true;
    },

    // Check if storage is available
    isAvailable() {
        return this.db !== null || (typeof localStorage !== 'undefined');
    }
};

// Initialize immediately
UniversalStorage.init();
