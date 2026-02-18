/**
 * Bhaskar Solar Platform - Chat Module
 * Handles messaging between customers and vendors
 */

const Chat = {
    // Current conversation
    currentConversation: null,
    currentRecipient: null,

    // Initialize chat
    init() {
        this.bindEvents();
    },

    // Bind event listeners
    bindEvents() {
        // Enter key to send message
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.id === 'chatInputField') {
                this.sendMessage();
            }
        });
    },

    // Load chat contacts based on user type
    loadContacts() {
        const session = DataStore.session.get();
        if (!session) return;

        const container = document.querySelector('.chat-sidebar');
        if (!container) return;

        let contacts = [];

        if (session.type === 'customer') {
            // Customer sees their vendor
            // Find customer by phone matching user's phone
            const user = DataStore.users.getById(session.userId);
            let customer = null;
            if (user && user.customerId) {
                customer = DataStore.customers.getById(user.customerId);
            }
            if (!customer && user) {
                customer = DataStore.customers.getAll().find(c => c.phone === user.phone);
            }
            if (customer && customer.vendorId) {
                const vendor = DataStore.users.getById(customer.vendorId);
                if (vendor) {
                    contacts.push({
                        id: vendor.id,
                        name: vendor.name,
                        avatar: this.getInitials(vendor.name),
                        color: '#F4A523',
                        online: true
                    });
                }
            }

            // Add support contact
            contacts.push({
                id: 'support',
                name: 'Support Team',
                avatar: 'SP',
                color: '#3498DB',
                online: false,
                lastSeen: '2h ago'
            });
        } else {
            // Vendor sees all their customers
            const customers = DataStore.customers.getByVendor(session.userId);
            customers.forEach(customer => {
                contacts.push({
                    id: customer.id,
                    name: customer.name,
                    avatar: this.getInitials(customer.name),
                    color: '#27AE60',
                    online: Math.random() > 0.5, // Random for demo
                    appCode: customer.appCode
                });
            });
        }

        this.contacts = contacts;
        this.renderContacts(container, contacts);
    },

    // Render contacts list
    renderContacts(container, contacts) {
        if (!contacts.length) {
            container.innerHTML = `
                <div class="no-contacts">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                    </svg>
                    <p>No conversations yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = contacts.map(contact => `
            <div class="chat-contact ${contact.id === this.currentRecipient ? 'active' : ''}"
                 onclick="Chat.selectContact('${contact.id}')">
                <div class="contact-avatar" style="background: ${contact.color};">
                    ${contact.avatar}
                </div>
                <div class="contact-info">
                    <span class="contact-name">${contact.name}</span>
                    ${contact.online !== undefined ? `
                        <span class="contact-status">
                            <span class="status-dot ${contact.online ? 'online' : ''}"></span>
                            ${contact.online ? 'Online' : (contact.lastSeen || 'Offline')}
                        </span>
                    ` : ''}
                    ${contact.appCode ? `<span class="contact-code">${contact.appCode}</span>` : ''}
                </div>
                ${this.getUnreadBadge(contact.id)}
            </div>
        `).join('');
    },

    // Get unread message badge
    getUnreadBadge(contactId) {
        const session = DataStore.session.get();
        if (!session) return '';

        const unreadCount = DataStore.messages.getUnreadCount(session.userId);
        // This is simplified - in production, you'd filter by sender
        return '';
    },

    // Select a contact to chat with
    selectContact(contactId) {
        this.currentRecipient = contactId;

        // Update active state
        document.querySelectorAll('.chat-contact').forEach(el => {
            el.classList.remove('active');
        });
        event.currentTarget.classList.add('active');

        // Load conversation
        this.loadConversation(contactId);
    },

    // Load conversation messages
    loadConversation(contactId) {
        const session = DataStore.session.get();
        if (!session) return;

        const messages = DataStore.messages.getConversation(session.userId, contactId);
        const container = document.getElementById('chatMessages');

        if (!container) return;

        if (!messages.length) {
            container.innerHTML = `
                <div class="no-messages">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                    <p>No messages yet</p>
                    <small>Start the conversation!</small>
                </div>
            `;
            return;
        }

        // Get contact info
        const contact = this.contacts.find(c => c.id === contactId);

        container.innerHTML = messages.map(msg => {
            const isSent = msg.fromUserId === session.userId;
            return `
                <div class="message ${isSent ? 'sent' : 'received'}">
                    ${!isSent ? `<span class="message-sender">${contact ? contact.name : 'Unknown'}</span>` : ''}
                    <p>${this.escapeHtml(msg.text)}</p>
                    <span class="message-time">${this.formatTime(msg.timestamp)}</span>
                </div>
            `;
        }).join('');

        // Mark as read
        const messageIds = messages.filter(m => !m.read && m.toUserId === session.userId).map(m => m.id);
        if (messageIds.length) {
            DataStore.messages.markAsRead(messageIds);
        }

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    },

    // Send a message
    sendMessage() {
        const input = document.getElementById('chatInputField');
        if (!input) return;

        const text = input.value.trim();
        if (!text) return;

        const session = DataStore.session.get();
        if (!session || !this.currentRecipient) {
            App.showToast('Please select a contact first', 'warning');
            return;
        }

        // Send message
        const message = DataStore.messages.send(session.userId, this.currentRecipient, text);

        // Clear input
        input.value = '';

        // Reload conversation
        this.loadConversation(this.currentRecipient);

        // Simulate reply for demo (if not support)
        if (this.currentRecipient !== 'support') {
            this.simulateReply(this.currentRecipient, text);
        }
    },

    // Simulate a reply (for demo purposes)
    simulateReply(contactId, originalMessage) {
        setTimeout(() => {
            const replies = [
                "Thank you for your message. I'll look into that right away.",
                "I understand. Let me check the status of your application.",
                "That's a great question! Your solar system is performing well.",
                "I'll schedule a technician visit soon.",
                "Your production data looks good. Is there anything specific you'd like to know?",
                "We've received your documents and are processing them.",
                "The installation is on track. I'll keep you updated."
            ];

            const randomReply = replies[Math.floor(Math.random() * replies.length)];

            // Send from the contact to current user
            const session = DataStore.session.get();
            DataStore.messages.send(contactId, session.userId, randomReply);

            // Reload conversation
            this.loadConversation(contactId);

            // Show notification
            App.showToast('New message received!', 'info');
        }, 2000 + Math.random() * 3000);
    },

    // Send message with button
    send() {
        this.sendMessage();
    },

    // Get initials from name
    getInitials(name) {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    },

    // Format timestamp
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
                ' ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
    },

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Add welcome message for new customer
    addWelcomeMessage(customerId, vendorId) {
        const vendor = DataStore.users.getById(vendorId);
        const vendorName = vendor ? vendor.name : 'Your Vendor';

        DataStore.messages.send(
            vendorId,
            customerId,
            `Welcome to Bhaskar Solar Platform! I'm here to help you with your solar installation. Your application is being processed.`
        );
    },

    // Get chat summary for dashboard
    getChatSummary() {
        const session = DataStore.session.get();
        if (!session) return { total: 0, unread: 0 };

        const conversations = DataStore.messages.getUserConversations(session.userId);
        const unread = DataStore.messages.getUnreadCount(session.userId);

        return {
            total: conversations.length,
            unread
        };
    },

    // Refresh chat
    refresh() {
        this.loadContacts();
        if (this.currentRecipient) {
            this.loadConversation(this.currentRecipient);
        }
    }
};

// Initialize chat on load
document.addEventListener('DOMContentLoaded', () => {
    Chat.init();
});
