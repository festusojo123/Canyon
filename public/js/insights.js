class InsightsApp {
    constructor() {
        this.charts = {};
        this.mockData = this.generateMockData();
        this.init();
    }

    async init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupSidebarNavigation();
        await this.checkAuthentication();
        this.initializeCharts();
        this.populatePerformers();
        this.populateBottlenecks();
        this.populatePerformanceTable();
    }

    setupElements() {
        this.timeRange = document.getElementById('timeRange');
        this.refreshBtn = document.getElementById('refreshData');
        this.exportBtn = document.getElementById('exportData');
        this.exportTableBtn = document.getElementById('exportTable');
        this.userMenu = document.getElementById('userMenu');
        this.userName = document.getElementById('userName');
    }

    setupEventListeners() {
        this.timeRange.addEventListener('change', () => this.updateTimeRange());
        this.refreshBtn.addEventListener('click', () => this.refreshData());
        this.exportBtn.addEventListener('click', () => this.exportReport());
        this.exportTableBtn.addEventListener('click', () => this.exportTable());
        this.userMenu.addEventListener('click', () => this.showUserMenu());
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
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;
            case 'support':
                window.location.href = '/support';
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
            approvalTimes: {
                'Account Executive': 1.2,
                'Deal Desk': 2.8,
                'Finance Team': 1.9,
                'Legal Team': 3.5,
                'CRO': 4.2,
                'Operations': 1.1
            },
            quotesByStage: {
                'Configuration': 45,
                'Pricing': 32,
                'Quoting': 28,
                'Contract Creation': 15,
                'Contract Negotiation': 12,
                'Contract Execution': 89,
                'Order Fulfillment': 45,
                'Billing': 32,
                'Revenue': 28,
                'Renewal': 15,
            },
            approvalRate: {
                approved: 87,
                rejected: 13
            },
            revenueTrend: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                closed: [2.1, 2.8, 3.2, 2.9, 3.8, 4.1, 3.9, 4.5, 4.2, 4.8, 5.1, 5.3],
                pipeline: [8.2, 9.1, 8.8, 9.5, 10.2, 11.1, 10.8, 11.5, 12.1, 12.8, 13.2, 13.9]
            },
            topPerformers: [
                { name: 'Sarah Johnson', metric: 'Closed Revenue', value: '$1.2M' },
                { name: 'Mike Chen', metric: 'Approval Rate', value: '94%' },
                { name: 'Emily Davis', metric: 'Avg Deal Size', value: '$285K' },
                { name: 'James Wilson', metric: 'Speed to Close', value: '2.1 days' },
                { name: 'Lisa Wang', metric: 'Pipeline Value', value: '$890K' }
            ],
            bottlenecks: [
                { stage: 'Legal Review', delay: '+2.3 days avg' },
                { stage: 'CRO Approval', delay: '+1.8 days avg' },
                { stage: 'Contract Negotiation', delay: '+1.2 days avg' },
                { stage: 'Finance Approval', delay: '+0.9 days avg' }
            ],
            recentQuotes: [
                { id: 'Q-2025-089', customer: 'Acme Corp', amount: 245000, stage: 'CRO Approval', daysInStage: 3, totalTime: 8, status: 'pending' },
                { id: 'Q-2025-088', customer: 'TechStart Inc', amount: 125000, stage: 'Deal Desk', daysInStage: 1, totalTime: 4, status: 'pending' },
                { id: 'Q-2025-087', customer: 'Global Systems', amount: 450000, stage: 'Closed Won', daysInStage: 0, totalTime: 6, status: 'approved' },
                { id: 'Q-2025-086', customer: 'Innovation Labs', amount: 89000, stage: 'Legal Review', daysInStage: 5, totalTime: 12, status: 'pending' },
                { id: 'Q-2025-085', customer: 'Data Solutions', amount: 320000, stage: 'Finance', daysInStage: 2, totalTime: 7, status: 'pending' },
                { id: 'Q-2025-084', customer: 'Cloud First', amount: 180000, stage: 'Rejected', daysInStage: 0, totalTime: 9, status: 'rejected' }
            ]
        };
    }

    initializeCharts() {
        this.createApprovalTimeChart();
        this.createQuotesByStageChart();
        this.createApprovalRateChart();
        this.createRevenueTrendChart();
    }

    createApprovalTimeChart() {
        const ctx = document.getElementById('approvalTimeChart').getContext('2d');
        const data = this.mockData.approvalTimes;
        
        this.charts.approvalTime = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    label: 'Avg. Days',
                    data: Object.values(data),
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(6, 182, 212, 0.8)'
                    ],
                    borderColor: [
                        'rgba(102, 126, 234, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(139, 92, 246, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(6, 182, 212, 1)'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            maxRotation: 45
                        }
                    }
                }
            }
        });
    }

    createQuotesByStageChart() {
        const ctx = document.getElementById('quotesByStageChart').getContext('2d');
        const data = this.mockData.quotesByStage;
        
        this.charts.quotesByStage = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(6, 182, 212, 0.8)'
                    ],
                    borderColor: [
                        'rgba(102, 126, 234, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(139, 92, 246, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(6, 182, 212, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    createApprovalRateChart() {
        const ctx = document.getElementById('approvalRateChart').getContext('2d');
        const data = this.mockData.approvalRate;
        
        this.charts.approvalRate = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Approved', 'Rejected'],
                datasets: [{
                    data: [data.approved, data.rejected],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderColor: [
                        'rgba(16, 185, 129, 1)',
                        'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    createRevenueTrendChart() {
        const ctx = document.getElementById('revenueTrendChart').getContext('2d');
        const data = this.mockData.revenueTrend;
        
        this.charts.revenueTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Closed Revenue ($M)',
                        data: data.closed,
                        borderColor: 'rgba(16, 185, 129, 1)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Pipeline Value ($M)',
                        data: data.pipeline,
                        borderColor: 'rgba(102, 126, 234, 1)',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    }
                }
            }
        });
    }

    populatePerformers() {
        const performersList = document.getElementById('performersList');
        const performers = this.mockData.topPerformers;
        
        performersList.innerHTML = performers.map((performer, index) => `
            <div class="performer-item">
                <div class="performer-rank">${index + 1}</div>
                <div class="performer-info">
                    <div class="performer-name">${performer.name}</div>
                    <div class="performer-metric">${performer.metric}</div>
                </div>
                <div class="performer-value">${performer.value}</div>
            </div>
        `).join('');
    }

    populateBottlenecks() {
        const bottlenecksList = document.getElementById('bottlenecksList');
        const bottlenecks = this.mockData.bottlenecks;
        
        bottlenecksList.innerHTML = bottlenecks.map(bottleneck => `
            <div class="bottleneck-item">
                <div class="bottleneck-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="bottleneck-info">
                    <div class="bottleneck-stage">${bottleneck.stage}</div>
                    <div class="bottleneck-delay">${bottleneck.delay}</div>
                </div>
            </div>
        `).join('');
    }

    populatePerformanceTable() {
        const tableBody = document.querySelector('#performanceTable tbody');
        const quotes = this.mockData.recentQuotes;
        
        tableBody.innerHTML = quotes.map(quote => `
            <tr>
                <td>${quote.id}</td>
                <td>${quote.customer}</td>
                <td>$${quote.amount.toLocaleString()}</td>
                <td>${quote.stage}</td>
                <td>${quote.daysInStage} days</td>
                <td>${quote.totalTime} days</td>
                <td><span class="status-badge ${quote.status}">${quote.status}</span></td>
            </tr>
        `).join('');
    }

    updateTimeRange() {
        const range = this.timeRange.value;
        console.log('Time range changed to:', range);
        
        // Show loading state
        this.showNotification('Updating data for selected time range...', 'info');
        
        // Simulate data refresh
        setTimeout(() => {
            this.refreshCharts();
            this.showNotification('Data updated successfully!', 'success');
        }, 1000);
    }

    refreshData() {
        this.showNotification('Refreshing all data...', 'info');
        
        // Simulate data refresh
        setTimeout(() => {
            this.mockData = this.generateMockData();
            this.refreshCharts();
            this.populatePerformers();
            this.populateBottlenecks();
            this.populatePerformanceTable();
            this.showNotification('Data refreshed successfully!', 'success');
        }, 1500);
    }

    refreshCharts() {
        // Destroy existing charts and recreate them
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
        this.initializeCharts();
    }

    exportReport() {
        this.showNotification('Generating comprehensive report...', 'info');
        
        // Simulate export
        setTimeout(() => {
            this.showNotification('Report exported successfully!', 'success');
        }, 2000);
    }

    exportTable() {
        this.showNotification('Exporting table data to CSV...', 'info');
        
        // Simulate CSV export
        setTimeout(() => {
            this.showNotification('CSV file downloaded!', 'success');
        }, 1000);
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
    window.insightsApp = new InsightsApp();
});
