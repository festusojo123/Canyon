class DashboardApp {
    constructor() {
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.initializeCharts();
        this.setupSidebarNavigation();
        await this.checkAuthentication();
    }

    async checkAuthentication() {
        try {
            const response = await fetch('/api/user');
            const data = await response.json();
            
            if (!data.authenticated) {
                window.location.href = '/?error=unauthorized';
                return;
            }
            
            // Add this line that was missing in the second method
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = data.user.firstName || data.user.name;
            }
            
        } catch (error) {
            console.error('Error checking authentication:', error);
            window.location.href = '/?error=auth_error';
        }
    }

    setupSidebarNavigation() {
        const navTabs = document.querySelectorAll('.nav-tab');
        
        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                navTabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Handle navigation based on tab
                const tabType = tab.getAttribute('data-tab');
                this.handleTabNavigation(tabType);
            });
        });
    }

    handleTabNavigation(tabType) {
        switch(tabType) {
            case 'dashboard':
                // Already on dashboard - maybe scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
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
                window.location.href = '/dashboard';
                break;
            default:
                console.log('Unknown tab:', tabType);
        }
    }

    setupEventListeners() {
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
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

    initializeCharts() {
        console.log('Charts initialized');
    }

    showError(message) {
        console.error(message);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new DashboardApp();
});
