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
            
            // Set user name and add click listener
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = data.user.firstName || data.user.name;
                
                // Add click listener for logout confirmation
                userNameElement.style.cursor = 'pointer';
                userNameElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showUserMenu();
                });
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

        // Also check for userMenu element (if it exists separately)
        const userMenu = document.getElementById('userMenu');
        if (userMenu) {
            userMenu.addEventListener('click', (e) => {
                e.preventDefault();
                this.showUserMenu();
            });
        }
    }

    showUserMenu() {
        // Create a more sophisticated confirmation dialog
        const confirmed = confirm('Would you like to sign out?');
        
        if (confirmed) {
            this.logout();
        }
    }

    // Alternative: Create a custom modal for logout confirmation
    showLogoutModal() {
        // Remove any existing modal
        const existingModal = document.querySelector('.logout-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'logout-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Sign Out</h3>
                    <button class="modal-close" onclick="this.closest('.logout-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to sign out of your account?</p>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.logout-modal').remove()">
                        Cancel
                    </button>
                    <button class="btn-primary" onclick="dashboardApp.confirmLogout()">
                        <i class="fas fa-sign-out-alt"></i>
                        Sign Out
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Add fade-in animation
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.transition = 'opacity 0.3s ease';
            modal.style.opacity = '1';
        }, 10);
    }

    confirmLogout() {
        // Remove the modal
        const modal = document.querySelector('.logout-modal');
        if (modal) {
            modal.remove();
        }
        
        // Proceed with logout
        this.logout();
    }

    async logout() {
        try {
            // Show loading state on user name
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                const originalText = userNameElement.textContent;
                userNameElement.textContent = 'Signing out...';
                userNameElement.style.opacity = '0.7';
            }

            const response = await fetch('/auth/logout', { method: 'POST' });
            
            if (response.ok) {
                // Show success message briefly before redirect
                this.showNotification('Successfully signed out', 'success');
                
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } else {
                throw new Error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
            
            // Reset user name display
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.style.opacity = '1';
                // You might want to restore the original name here
            }
            
            this.showNotification('Error signing out. Please try again.', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    initializeCharts() {
        console.log('Charts initialized');
    }

    showError(message) {
        console.error(message);
        this.showNotification(message, 'error');
    }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.dashboardApp = new DashboardApp(); // Make it globally accessible for modal callbacks
});
