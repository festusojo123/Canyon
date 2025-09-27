class SupportApp {
    constructor() {
        this.mockData = this.generateMockData();
        this.init();
    }

    async init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupSidebarNavigation();
        await this.checkAuthentication();
        this.populateTickets();
        this.populateArticles();
        this.populateSystemStatus();
        this.populateUpdates();
        this.populateFAQ();
    }

    setupElements() {
        this.userMenu = document.getElementById('userMenu');
        this.userName = document.getElementById('userName');
        this.createTicketBtn = document.getElementById('createTicket');
        this.viewKnowledgeBaseBtn = document.getElementById('viewKnowledgeBase');
        this.ticketModal = document.getElementById('ticketModal');
        this.closeTicketModalBtn = document.getElementById('closeTicketModal');
        this.ticketForm = document.getElementById('ticketForm');
        this.cancelTicketBtn = document.getElementById('cancelTicket');
        this.ticketFilter = document.getElementById('ticketFilter');
    }

    setupEventListeners() {
        this.userMenu.addEventListener('click', () => this.showUserMenu());
        this.createTicketBtn.addEventListener('click', () => this.openTicketModal());
        this.viewKnowledgeBaseBtn.addEventListener('click', () => this.openKnowledgeBase());
        this.closeTicketModalBtn.addEventListener('click', () => this.closeTicketModal());
        this.cancelTicketBtn.addEventListener('click', () => this.closeTicketModal());
        this.ticketForm.addEventListener('submit', (e) => this.submitTicket(e));
        this.ticketFilter.addEventListener('change', () => this.filterTickets());

        // Quick action cards
        document.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', () => {
                const action = card.getAttribute('data-action');
                this.handleQuickAction(action);
            });
        });

        // FAQ toggles
        document.addEventListener('click', (e) => {
            if (e.target.closest('.faq-question')) {
                const faqItem = e.target.closest('.faq-item');
                this.toggleFAQ(faqItem);
            }
        });

        // Close modal on overlay click
        this.ticketModal.addEventListener('click', (e) => {
            if (e.target === this.ticketModal) {
                this.closeTicketModal();
            }
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.ticketModal.classList.contains('active')) {
                this.closeTicketModal();
            }
        });
    }

    setupSidebarNavigation() {
        const navTabs = document.querySelectorAll('.nav-tab');
        
        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                navTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const tabType = tab.getAttribute('data-tab');
                this.handleTabNavigation(tabType);
            });
        });
    }

    handleTabNavigation(tabType) {
        switch(tabType) {
            case 'dashboard':
                window.location.href = '/dashboard';
                break;
            case 'quotes':
                window.location.href = '/quotes';
                break;
            case 'create-quotes':
                window.location.href = '/quotes/create';
                break;
            case 'insights':
                window.location.href = '/insights';
                break;
            case 'support':
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;
            default:
                console.log('Unknown tab:', tabType);
        }
    }

    async checkAuthentication() {
        try {
            const response = await fetch('/api/user');
            const data = await response.json();
            
            if (!data.authenticated) {
                window.location.href = '/?error=unauthorized';
                return;
            }
            
            this.userName.textContent = data.user.firstName || data.user.name;
            
        } catch (error) {
            console.error('Error checking authentication:', error);
            // For demo purposes, continue with mock data
            this.userName.textContent = 'Demo User';
        }
    }

    generateMockData() {
        return {
            tickets: [
                {
                    id: 'TKT-2025-001',
                    subject: 'Unable to generate PDF quotes',
                    category: 'technical',
                    priority: 'high',
                    status: 'open',
                    created: '2025-09-25',
                    updated: '2025-09-26'
                },
                {
                    id: 'TKT-2025-002',
                    subject: 'Billing discrepancy for Q3',
                    category: 'billing',
                    priority: 'medium',
                    status: 'in-progress',
                    created: '2025-09-24',
                    updated: '2025-09-25'
                },
                {
                    id: 'TKT-2025-003',
                    subject: 'Feature request: Bulk quote approval',
                    category: 'feature',
                    priority: 'low',
                    status: 'resolved',
                    created: '2025-09-20',
                    updated: '2025-09-23'
                },
                {
                    id: 'TKT-2025-004',
                    subject: 'Training on new pricing module',
                    category: 'training',
                    priority: 'medium',
                    status: 'open',
                    created: '2025-09-22',
                    updated: '2025-09-24'
                }
            ],
            articles: [
                {
                    id: 1,
                    title: 'How to create a new quote',
                    views: 1250,
                    category: 'Getting Started'
                },
                {
                    id: 2,
                    title: 'Setting up approval workflows',
                    views: 890,
                    category: 'Configuration'
                },
                {
                    id: 3,
                    title: 'Troubleshooting PDF generation',
                    views: 654,
                    category: 'Troubleshooting'
                },
                {
                    id: 4,
                    title: 'Understanding pricing rules',
                    views: 432,
                    category: 'Pricing'
                },
                {
                    id: 5,
                    title: 'Managing user permissions',
                    views: 321,
                    category: 'Administration'
                }
            ],
            systemStatus: [
                {
                    service: 'Quote Generation',
                    status: 'operational'
                },
                {
                    service: 'PDF Export',
                    status: 'operational'
                },
                {
                    service: 'Approval Workflows',
                    status: 'operational'
                },
                {
                    service: 'Pricing Engine',
                    status: 'operational'
                },
                {
                    service: 'Email Notifications',
                    status: 'operational'
                },
                {
                    service: 'API Services',
                    status: 'operational'
                }
            ],
            updates: [
                {
                    title: 'New Feature: Advanced Pricing Rules',
                    description: 'We\'ve added support for complex pricing scenarios with conditional logic.',
                    date: '2025-09-25',
                    type: 'feature'
                },
                {
                    title: 'Performance Improvements',
                    description: 'Quote generation is now 40% faster with our latest optimizations.',
                    date: '2025-09-20',
                    type: 'improvement'
                },
                {
                    title: 'Security Update',
                    description: 'Enhanced security measures for data protection and compliance.',
                    date: '2025-09-18',
                    type: 'security'
                },
                {
                    title: 'Bug Fix: PDF Export Issue',
                    description: 'Resolved issue where some quotes would fail to export to PDF.',
                    date: '2025-09-15',
                    type: 'bugfix'
                }
            ],
            faq: [
                {
                    question: 'How do I create a new quote?',
                    answer: 'To create a new quote, navigate to the Quotes section and click "Create Quote". Fill in the customer information, add products, and configure pricing. The system will guide you through each step of the process.'
                },
                {
                    question: 'Why is my quote stuck in approval?',
                    answer: 'Quotes may be held in approval for several reasons: the amount exceeds your approval limit, required approvers are unavailable, or additional documentation is needed. Check the quote details for specific approval requirements.'
                },
                {
                    question: 'How can I track quote performance?',
                    answer: 'Use the Insights dashboard to view comprehensive analytics including approval times, conversion rates, and revenue metrics. You can filter by date range, sales rep, or product category.'
                },
                {
                    question: 'Can I customize the quote template?',
                    answer: 'Yes, administrators can customize quote templates including logos, colors, terms and conditions, and field layouts. Contact your system administrator for template modifications.'
                },
                {
                    question: 'How do I export quotes to PDF?',
                    answer: 'Open any quote and click the "Export PDF" button in the top right. The system will generate a formatted PDF that you can download or email directly to customers.'
                },
                {
                    question: 'What browsers are supported?',
                    answer: 'Canyon Q2C supports the latest versions of Chrome, Firefox, Safari, and Edge. For the best experience, we recommend using Chrome or Firefox with JavaScript enabled.'
                }
            ]
        };
    }

    populateTickets() {
        const ticketsList = document.getElementById('ticketsList');
        const tickets = this.mockData.tickets;
        
        ticketsList.innerHTML = tickets.map(ticket => `
            <div class="ticket-item" data-ticket-id="${ticket.id}">
                <div class="ticket-priority ${ticket.priority}"></div>
                <div class="ticket-info">
                    <div class="ticket-title">${ticket.subject}</div>
                    <div class="ticket-meta">
                        <span>ID: ${ticket.id}</span>
                        <span>Created: ${this.formatDate(ticket.created)}</span>
                        <span>Updated: ${this.formatDate(ticket.updated)}</span>
                    </div>
                </div>
                <div class="ticket-status ${ticket.status}">${ticket.status.replace('-', ' ')}</div>
            </div>
        `).join('');

        // Add click handlers for tickets
        document.querySelectorAll('.ticket-item').forEach(item => {
            item.addEventListener('click', () => {
                const ticketId = item.getAttribute('data-ticket-id');
                this.viewTicket(ticketId);
            });
        });
    }

    populateArticles() {
        const articlesList = document.getElementById('articlesList');
        const articles = this.mockData.articles;
        
        articlesList.innerHTML = articles.map(article => `
            <div class="article-item" data-article-id="${article.id}">
                <div class="article-icon">
                    <i class="fas fa-file-alt"></i>
                </div>
                <div class="article-info">
                    <div class="article-title">${article.title}</div>
                    <div class="article-views">${article.views} views • ${article.category}</div>
                </div>
            </div>
        `).join('');

        // Add click handlers for articles
        document.querySelectorAll('.article-item').forEach(item => {
            item.addEventListener('click', () => {
                const articleId = item.getAttribute('data-article-id');
                this.viewArticle(articleId);
            });
        });
    }

    populateSystemStatus() {
        const systemStatus = document.getElementById('systemStatus');
        const services = this.mockData.systemStatus;
        
        systemStatus.innerHTML = services.map(service => `
            <div class="service-item">
                <div class="service-name">${service.service}</div>
                <div class="service-status ${service.status}">
                    <i class="fas ${service.status === 'operational' ? 'fa-check-circle' : service.status === 'degraded' ? 'fa-exclamation-triangle' : 'fa-times-circle'}"></i>
                    ${service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                </div>
            </div>
        `).join('');
    }

    populateUpdates() {
        const updatesList = document.getElementById('updatesList');
        const updates = this.mockData.updates;
        
        updatesList.innerHTML = updates.map(update => `
            <div class="update-item">
                <div class="update-title">${update.title}</div>
                <div class="update-description">${update.description}</div>
                <div class="update-date">${this.formatDate(update.date)}</div>
            </div>
        `).join('');
    }

    populateFAQ() {
        const faqList = document.getElementById('faqList');
        const faqs = this.mockData.faq;
        
        faqList.innerHTML = faqs.map((faq, index) => `
            <div class="faq-item" data-faq-index="${index}">
                <div class="faq-question">
                    <h4>${faq.question}</h4>
                    <i class="fas fa-chevron-down faq-toggle"></i>
                </div>
                <div class="faq-answer">
                    <p>${faq.answer}</p>
                </div>
            </div>
        `).join('');
    }

    handleQuickAction(action) {
        switch(action) {
            case 'create-ticket':
                this.openTicketModal();
                break;
            case 'live-chat':
                this.startLiveChat();
                break;
            case 'documentation':
                this.openKnowledgeBase();
                break;
            case 'system-status':
                this.showSystemStatus();
                break;
            default:
                console.log('Unknown action:', action);
        }
    }

    openTicketModal() {
        this.ticketModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeTicketModal() {
        this.ticketModal.classList.remove('active');
        document.body.style.overflow = '';
        this.ticketForm.reset();
    }

    async submitTicket(e) {
        e.preventDefault();
        
        const formData = new FormData(this.ticketForm);
        const ticketData = {
            subject: formData.get('subject'),
            category: formData.get('category'),
            priority: formData.get('priority'),
            description: formData.get('description')
        };

        this.showNotification('Submitting your support ticket...', 'info');

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Generate mock ticket ID
            const ticketId = `TKT-2025-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
            
            this.showNotification(`Ticket ${ticketId} created successfully! We'll respond within 4 hours.`, 'success');
            this.closeTicketModal();
            
            // Add new ticket to the list
            this.addNewTicket({
                id: ticketId,
                subject: ticketData.subject,
                category: ticketData.category,
                priority: ticketData.priority,
                status: 'open',
                created: new Date().toISOString().split('T')[0],
                updated: new Date().toISOString().split('T')[0]
            });
            
        } catch (error) {
            console.error('Error submitting ticket:', error);
            this.showNotification('Failed to submit ticket. Please try again.', 'error');
        }
    }

    addNewTicket(ticket) {
        this.mockData.tickets.unshift(ticket);
        this.populateTickets();
    }

    filterTickets() {
        const filter = this.ticketFilter.value;
        const tickets = document.querySelectorAll('.ticket-item');
        
        tickets.forEach(ticket => {
            const status = ticket.querySelector('.ticket-status').textContent.trim().replace(' ', '-');
            
            if (filter === 'all' || status === filter) {
                ticket.style.display = 'flex';
            } else {
                ticket.style.display = 'none';
            }
        });
    }

    toggleFAQ(faqItem) {
        const isActive = faqItem.classList.contains('active');
        
        // Close all FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Open clicked item if it wasn't active
        if (!isActive) {
            faqItem.classList.add('active');
        }
    }

    viewTicket(ticketId) {
        this.showNotification(`Opening ticket ${ticketId}...`, 'info');
        // In a real app, this would navigate to the ticket detail page
    }

    viewArticle(articleId) {
        this.showNotification(`Opening article...`, 'info');
        // In a real app, this would open the knowledge base article
    }

    startLiveChat() {
        this.showNotification('Connecting to live chat...', 'info');
        // In a real app, this would open the chat widget
    }

    openKnowledgeBase() {
        this.showNotification('Opening knowledge base...', 'info');
        // In a real app, this would navigate to the knowledge base
    }

    showSystemStatus() {
        // Scroll to system status section
        document.querySelector('.support-card .card-header h3 i.fa-heartbeat').closest('.support-card').scrollIntoView({
            behavior: 'smooth'
        });
    }

    showUserMenu() {
        if (confirm('Would you like to sign out?')) {
            this.logout();
        }
    }

    async logout() {
        try {
            await fetch('/auth/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/';
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add notification styles if not already present
        if (!document.querySelector('.notification-styles')) {
            const styles = document.createElement('style');
            styles.className = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    z-index: 10000;
                    background: rgba(17, 24, 39, 0.95);
                    border: 1px solid #374151;
                    border-radius: 8px;
                    backdrop-filter: blur(20px);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                    animation: slideInRight 0.3s ease;
                    max-width: 400px;
                    margin-bottom: 1rem;
                }
                .notification.success { border-left: 4px solid #10b981; }
                .notification.error { border-left: 4px solid #ef4444; }
                .notification.info { border-left: 4px solid #06b6d4; }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px 20px;
                    color: #ffffff;
                }
                .notification-close {
                    background: none;
                    border: none;
                    color: #9ca3af;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    margin-left: auto;
                }
                .notification-close:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #ffffff;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.supportApp = new SupportApp();
});
