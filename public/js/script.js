class CanyonApp {
    constructor() {
        this.init();
        this.setupGoogleSSO();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.updateScrollIndicator();
        this.setupIntersectionObserver();
        this.loadInitialContent();
    }

    setupElements() {
        this.verticalTabs = document.getElementById('verticalTabs');
        this.tabButtons = document.querySelectorAll('.tab-item');
        this.scrollUpBtn = document.getElementById('scrollUp');
        this.scrollDownBtn = document.getElementById('scrollDown');
        this.scrollThumb = document.getElementById('scrollThumb');
        
        // Content elements
        this.contentCard = document.getElementById('contentCard');
        this.contentIcon = document.getElementById('contentIcon');
        this.contentTitle = document.getElementById('contentTitle');
        this.contentSubtitle = document.getElementById('contentSubtitle');
        this.contentText = document.getElementById('contentText');
        this.contentStats = document.getElementById('contentStats');
        this.contentFeatures = document.getElementById('contentFeatures');
        
        this.isLoading = false;
    }

    setupEventListeners() {
        // Tab click events
        this.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.currentTarget.getAttribute('data-tab');
                this.switchTab(e.currentTarget, tabName);
            });
        });

        // Scroll button events
        this.scrollUpBtn.addEventListener('click', () => this.scrollTabs(-1));
        this.scrollDownBtn.addEventListener('click', () => this.scrollTabs(1));

        // Scroll events
        this.verticalTabs.addEventListener('scroll', () => {
            this.updateScrollIndicator();
            this.updateScrollButtons();
        });

        // Keyboard navigation
        this.verticalTabs.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });

        // Wheel scroll on tabs
        this.verticalTabs.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.verticalTabs.scrollTop += e.deltaY;
        });

        // Navbar scroll effect
        window.addEventListener('scroll', () => this.handleNavbarScroll());

        // Explore button click
        const exploreBtn = document.getElementById('exploreBtn');
        if (exploreBtn) {
            exploreBtn.addEventListener('click', () => {
                document.querySelector('.main-content').scrollIntoView({
                    behavior: 'smooth'
                });
            });
        }

        // Resize handler
        window.addEventListener('resize', () => {
            this.updateScrollIndicator();
            this.updateScrollButtons();
        });
    }

    async switchTab(tabButton, tabName) {
        if (this.isLoading) return;

        // Update active tab
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        tabButton.classList.add('active');

        // Scroll tab into view
        this.scrollTabIntoView(tabButton);

        // Load content
        await this.loadTabContent(tabName);
    }

    async loadTabContent(tabName) {
        if (this.isLoading) return;

        this.isLoading = true;
        this.contentCard.classList.add('loading');

        try {
            // Add fade out effect
            this.contentCard.classList.add('content-transition', 'fade-out');

            // Wait for fade out
            await this.delay(200);

            // Fetch content
            const response = await fetch(`/api/content/${tabName}`);
            const data = await response.json();

            // Update content
            this.updateContentDisplay(data);

            // Wait a bit then fade in
            await this.delay(100);
            this.contentCard.classList.remove('fade-out');
            this.contentCard.classList.add('fade-in');

            // Clean up classes
            setTimeout(() => {
                this.contentCard.classList.remove('content-transition', 'fade-in');
            }, 300);

        } catch (error) {
            console.error('Error loading content:', error);
            this.showErrorState();
        } finally {
            this.isLoading = false;
            this.contentCard.classList.remove('loading');
        }
    }

    updateContentDisplay(data) {
        // Update text content
        this.contentIcon.textContent = data.image;
        this.contentTitle.textContent = data.title;
        this.contentSubtitle.textContent = data.subtitle;
        this.contentText.textContent = data.content;

        // Update stats
        this.updateStats(data.stats);

        // Update features
        this.contentFeatures.innerHTML = '';
        data.features.forEach(feature => {
            const featureElement = this.createFeatureElement(feature);
            this.contentFeatures.appendChild(featureElement);
        });
    }

    updateStats(stats) {
        if (!stats || Object.keys(stats).length === 0) return;

        const statBoxes = this.contentStats.querySelectorAll('.stat-box');
        const statKeys = Object.keys(stats);
        
        statBoxes.forEach((box, index) => {
            if (statKeys[index]) {
                const key = statKeys[index];
                const value = stats[key];
                box.querySelector('.stat-value').textContent = value;
                box.querySelector('.stat-name').textContent = this.formatStatName(key);
            }
        });
    }

    formatStatName(key) {
        const nameMap = {
            users: 'Users',
            uptime: 'Uptime',
            countries: 'Countries',
            integrations: 'Integrations',
            automations: 'Automations',
            savings: 'Savings',
            dataPoints: 'Data Points',
            accuracy: 'Accuracy',
            reports: 'Reports',
            teams: 'Teams',
            projects: 'Projects',
            messages: 'Messages',
            certifications: 'Certifications',
            threats: 'Threats',
            apis: 'APIs',
            calls: 'API Calls',
            partners: 'Partners',
            response: 'Response Time',
            satisfaction: 'Satisfaction',
            articles: 'Articles'
        };
        return nameMap[key] || key;
    }

    createFeatureElement(feature) {
        const featureItem = document.createElement('div');
        featureItem.className = 'feature-item';
        
        featureItem.innerHTML = `
            <div class="feature-icon">
                <i class="${feature.icon}"></i>
            </div>
            <span>${feature.text}</span>
        `;
        
        return featureItem;
    }

    scrollTabs(direction) {
        const scrollAmount = 120;
        this.verticalTabs.scrollBy({
            top: direction * scrollAmount,
            behavior: 'smooth'
        });
    }

    scrollTabIntoView(tabButton) {
        const tabsRect = this.verticalTabs.getBoundingClientRect();
        const buttonRect = tabButton.getBoundingClientRect();
        const tabsScrollTop = this.verticalTabs.scrollTop;

        if (buttonRect.top < tabsRect.top) {
            this.verticalTabs.scrollTo({
                top: tabsScrollTop - (tabsRect.top - buttonRect.top) - 20,
                behavior: 'smooth'
            });
        } else if (buttonRect.bottom > tabsRect.bottom) {
            this.verticalTabs.scrollTo({
                top: tabsScrollTop + (buttonRect.bottom - tabsRect.bottom) + 20,
                behavior: 'smooth'
            });
        }
    }

    updateScrollIndicator() {
        const { scrollTop, scrollHeight, clientHeight } = this.verticalTabs;
        const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
        const thumbHeight = (clientHeight / scrollHeight) * 100;
        const thumbPosition = scrollPercentage * (100 - thumbHeight);

        this.scrollThumb.style.height = `${Math.max(thumbHeight, 10)}%`;
        this.scrollThumb.style.top = `${thumbPosition}%`;
    }

    updateScrollButtons() {
        const { scrollTop, scrollHeight, clientHeight } = this.verticalTabs;
        const isAtTop = scrollTop <= 0;
        const isAtBottom = scrollTop >= scrollHeight - clientHeight - 1;

        this.scrollUpBtn.disabled = isAtTop;
        this.scrollDownBtn.disabled = isAtBottom;

        this.scrollUpBtn.style.opacity = isAtTop ? '0.3' : '1';
        this.scrollDownBtn.style.opacity = isAtBottom ? '0.3' : '1';
    }

    handleKeyboardNavigation(e) {
        const activeTab = document.querySelector('.tab-item.active');
        const currentIndex = Array.from(this.tabButtons).indexOf(activeTab);
        let newIndex;

        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                newIndex = Math.max(0, currentIndex - 1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                newIndex = Math.min(this.tabButtons.length - 1, currentIndex + 1);
                break;
            case 'Home':
                e.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                e.preventDefault();
                newIndex = this.tabButtons.length - 1;
                break;
            default:
                return;
        }

        if (newIndex !== undefined && newIndex !== currentIndex) {
            const newTab = this.tabButtons[newIndex];
            const tabName = newTab.getAttribute('data-tab');
            this.switchTab(newTab, tabName);
            newTab.focus();
        }
    }

    handleNavbarScroll() {
        const navbar = document.querySelector('.navbar');
        const scrolled = window.scrollY > 50;
        
        if (scrolled) {
            navbar.style.background = 'rgba(10, 10, 15, 0.98)';
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
        } else {
            navbar.style.background = 'rgba(10, 10, 15, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    }

    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.feature-showcase-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s ease';
            observer.observe(card);
        });
    }

    async loadInitialContent() {
        const firstTab = document.querySelector('.tab-item.active');
        if (firstTab) {
            const tabName = firstTab.getAttribute('data-tab');
            await this.loadTabContent(tabName);
        }
    }

    showErrorState() {
        this.contentTitle.textContent = 'Error Loading Content';
        this.contentSubtitle.textContent = 'Please try again';
        this.contentText.textContent = 'There was an error loading the content. Please check your connection and try again.';
        this.contentFeatures.innerHTML = '';
        this.contentIcon.textContent = '❌';
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Google SSO functionality
    setupGoogleSSO() {
        this.checkAuthStatus();
        this.setupAuthButtons();
        this.checkAuthErrors();
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/api/user');
            const data = await response.json();
            
            if (data.authenticated) {
                this.updateUIForAuthenticatedUser(data.user);
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
        }
    }

    setupAuthButtons() {
        // Get Started button
        const getStartedBtn = document.getElementById('getStartedBtn');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.initiateGoogleSSO();
            });
        }

        // Nav Sign In button
        const navSignIn = document.getElementById('navSignIn');
        if (navSignIn) {
            navSignIn.addEventListener('click', (e) => {
                e.preventDefault();
                this.initiateGoogleSSO();
            });
        }

        // Try Now button
        const tryNowBtn = document.getElementById('tryNowBtn');
        if (tryNowBtn) {
            tryNowBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.initiateGoogleSSO();
            });
        }

        // CTA Sign Up button
        const ctaSignUp = document.getElementById('ctaSignUp');
        if (ctaSignUp) {
            ctaSignUp.addEventListener('click', (e) => {
                e.preventDefault();
                this.initiateGoogleSSO();
            });
        }
    }

    initiateGoogleSSO() {
        this.showSSOLoading();
        window.location.href = '/auth/google';
    }

    showSSOLoading() {
        const buttons = document.querySelectorAll('#getStartedBtn, #navSignIn, #tryNowBtn, #ctaSignUp');
        buttons.forEach(btn => {
            if (btn) {
                const originalContent = btn.innerHTML;
                btn.innerHTML = `
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Connecting...</span>
                `;
                btn.disabled = true;
                btn.dataset.originalContent = originalContent;
            }
        });
    }

    updateUIForAuthenticatedUser(user) {
        // Update Get Started button
        const getStartedBtn = document.getElementById('getStartedBtn');
        if (getStartedBtn) {
            getStartedBtn.innerHTML = `
                <i class="fas fa-tachometer-alt"></i>
                <span>Go to Dashboard</span>
                <i class="fas fa-arrow-right"></i>
            `;
            getStartedBtn.onclick = () => window.location.href = '/dashboard';
        }

        // Update nav button
        const navSignIn = document.getElementById('navSignIn');
        if (navSignIn) {
            navSignIn.innerHTML = `
                <img src="${user.picture}" alt="${user.name}" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;">
                Dashboard
            `;
            navSignIn.onclick = () => window.location.href = '/dashboard';
        }

        // Update Try Now button
        const tryNowBtn = document.getElementById('tryNowBtn');
        if (tryNowBtn) {
            tryNowBtn.innerHTML = `
                <i class="fas fa-tachometer-alt"></i>
                <span>Dashboard</span>
            `;
            tryNowBtn.onclick = () => window.location.href = '/dashboard';
        }

        // Update CTA button
        const ctaSignUp = document.getElementById('ctaSignUp');
        if (ctaSignUp) {
            ctaSignUp.innerHTML = `
                <i class="fas fa-tachometer-alt"></i>
                <span>Go to Dashboard</span>
                <i class="fas fa-arrow-right"></i>
            `;
            ctaSignUp.onclick = () => window.location.href = '/dashboard';
        }

        // Show welcome message
        this.showWelcomeMessage(user);
    }

    showWelcomeMessage(user) {
        const heroSubtitle = document.querySelector('.hero-subtitle');
        if (heroSubtitle) {
            heroSubtitle.innerHTML = `
                Welcome back, <strong>${user.firstName}</strong>! 
                Ready to explore your dashboard with our innovative vertical navigation system?
            `;
        }
    }

    checkAuthErrors() {
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        
        if (error) {
            let errorMessage = 'Authentication failed. Please try again.';
            
            switch (error) {
                case 'auth_failed':
                    errorMessage = 'Google authentication failed. Please try again.';
                    break;
                case 'unauthorized':
                    errorMessage = 'You need to sign in to access that page.';
                    break;
            }
            
            this.showErrorNotification(errorMessage);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    showErrorNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'auth-notification error';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-exclamation-circle"></i>
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

    showSuccessNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'auth-notification success';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
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
        }, 8080);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CanyonApp();
});

// Additional interactive features
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add ripple effect to buttons
    document.querySelectorAll('.btn-primary, .btn-secondary, .nav-cta, .cta-button').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Add CSS for ripple animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
    }
});
