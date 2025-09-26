class DashboardApp {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadUserProfile();
        this.setupEventListeners();
        this.initializeCharts();
        this.setupSidebarNavigation();
    }

    async loadUserProfile() {
        try {
            const response = await fetch('/api/user');
            const data = await response.json();

            if (data.authenticated) {
                this.updateUserInfo(data.user);
                this.showUserProfile(data.user);
            } else {
                window.location.href = '/?error=unauthorized';
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            this.showError('Failed to load user profile');
        }
    }

    updateUserInfo(user) {
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');

        if (user.picture) {
            userAvatar.innerHTML = `<img src="${user.picture}" alt="${user.name}">`;
        }

        userName.textContent = user.name;
        userEmail.textContent = user.email;

        // Extract first name from full name for welcome message (FIXED SYNTAX)
        const firstName = user.given_name || user.name.split(' ')[0] || user.name;
        
        // Update welcome title with user's first name
        const welcomeTitle = document.querySelector('.welcome-title');
        if (welcomeTitle) {
            welcomeTitle.innerHTML = `Welcome back, <span style="color: #667eea;">${firstName}</span>!`;
        }
    }

    showUserProfile(user) {
        // This method is now empty since we're removing the profile section
        console.log('Profile loaded for:', user.name);
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

    async logout() {
        try {
            // Show loading state
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.disabled = true;
                logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Logging out...</span>';
            }

            // 1. Sign out from Google first
            if (typeof gapi !== 'undefined' && gapi.auth2) {
                const auth2 = gapi.auth2.getAuthInstance();
                if (auth2) {
                    await auth2.signOut();
                    console.log('User signed out from Google');
                }
            }

            // 2. Call backend logout endpoint to destroy session
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // 3. Clear local storage regardless of response
            localStorage.clear();
            sessionStorage.clear();

            // 4. Redirect to home page
            window.location.href = '/';

        } catch (error) {
            console.error('Logout error:', error);
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/';
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
