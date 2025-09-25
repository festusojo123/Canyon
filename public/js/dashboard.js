class DashboardApp {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadUserProfile();
        this.setupEventListeners();
        this.initializeCharts();
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

        // Update welcome title with user's first name
        const welcomeTitle = document.querySelector('.welcome-title');
        if (welcomeTitle) {
            welcomeTitle.innerHTML = `Welcome back, <span style="color: var(--primary-color);">${user.firstName}</span>!`;
        }
    }

    showUserProfile(user) {
        const profileCard = document.getElementById('profileCard');
        
        profileCard.innerHTML = `
            <div class="profile-info">
                <div class="profile-avatar">
                    <img src="${user.picture}" alt="${user.name}">
                </div>
                <div class="profile-details">
                    <div class="profile-field">
                        <span class="profile-label">Full Name</span>
                        <span class="profile-value">${user.name}</span>
                    </div>
                    <div class="profile-field">
                        <span class="profile-label">Email Address</span>
                        <span class="profile-value">${user.email}</span>
                    </div>
                    <div class="profile-field">
                        <span class="profile-label">First Name</span>
                        <span class="profile-value">${user.firstName}</span>
                    </div>
                    <div class="profile-field">
                        <span class="profile-label">Last Name</span>
                        <span class="profile-value">${user.lastName}</span>
                    </div>
                    <div class="profile-field">
                        <span class="profile-label">User ID</span>
                        <span class="profile-value">${user.id}</span>
                    </div>
                    <div class="profile-field">
                        <span class="profile-label">Authentication</span>
                        <span class="profile-value">Google OAuth 2.0</span>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const logoutBtn = document.getElementById('logoutBtn');
