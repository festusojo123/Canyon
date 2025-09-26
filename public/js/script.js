class CanyonApp {
    constructor() {
        this.init();
        this.setupGoogleSSO();
    }

    async init() {
        this.setupElements();
        this.setupEventListeners();
        
        console.log('Initializing quotes app...'); // Debug log
        
        const isAuthenticated = await this.checkAuthentication();
        if (!isAuthenticated) {
            return; // Stop initialization if not authenticated
        }
        
        await this.loadQuotes();
        this.updateStats();
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

        // Special handling for quotes tab
        if (data.isQuotesTab) {
            this.handleQuotesTab();
        }

        // Special handling for quotes redirect
        if (data.isQuotesRedirect) {
            this.handleQuotesRedirect();
        }
    }

    async handleQuotesTab() {
        try {
            // Check authentication first
            const authResponse = await fetch('/api/user');
            const authData = await authResponse.json();
            
            if (authData.authenticated) {
                // User is authenticated, load full quotes interface
                this.loadQuotesInterface();
            } else {
                // User not authenticated, show preview with sign-in prompt
                this.showQuotesPreview();
            }
        } catch (error) {
            console.error('Error checking auth for quotes:', error);
            this.showQuotesPreview();
        }
    }

    showQuotesPreview() {
        const quotesContainer = document.createElement('div');
        quotesContainer.className = 'quotes-preview';
        quotesContainer.innerHTML = `
            <div class="preview-content">
                <div class="preview-header">
                    <i class="fas fa-eye"></i>
                    <h3>Quotes Management Preview</h3>
                    <p>Sign in to access the full quotes management system</p>
                </div>
                
                <div class="preview-features">
                    <div class="preview-feature">
                        <i class="fas fa-route"></i>
                        <span>Custom Approval Workflows</span>
                    </div>
                    <div class="preview-feature">
                        <i class="fas fa-users-cog"></i>
                        <span>Role-Based Approvals</span>
                    </div>
                    <div class="preview-feature">
                        <i class="fas fa-arrows-alt"></i>
                        <span>Drag & Drop Workflow Builder</span>
                    </div>
                    <div class="preview-feature">
                        <i class="fas fa-clock"></i>
                        <span>Real-time Status Tracking</span>
                    </div>
                </div>

                <div class="preview-mockup">
                    <div class="mockup-quote-card">
                        <div class="mockup-header">
                            <div>
                                <strong>Q-2025-001</strong>
                                <div class="mockup-customer">Acme Corporation</div>
                            </div>
                            <div class="mockup-details">
                                <span class="mockup-amount">$125,000</span>
                                <span class="mockup-discount">12% discount</span>
                            </div>
                        </div>
                        <div class="mockup-workflow">
                            <div class="mockup-step completed">
                                <i class="fas fa-check"></i>
                                <span>AE</span>
                            </div>
                            <div class="mockup-connector"></div>
                            <div class="mockup-step pending">
                                <i class="fas fa-clock"></i>
                                <span>Deal Desk</span>
                            </div>
                            <div class="mockup-connector"></div>
                            <div class="mockup-step waiting">
                                <i class="fas fa-circle"></i>
                                <span>Customer</span>
                            </div>
                        </div>
                        <div class="mockup-actions">
                            <button class="mockup-btn secondary" disabled>
                                <i class="fas fa-edit"></i>
                                Edit Workflow
                            </button>
                            <button class="mockup-btn primary" disabled>
                                <i class="fas fa-eye"></i>
                                View Details
                            </button>
                        </div>
                    </div>
                    
                    <div class="preview-workflow-builder">
                        <h4>Drag & Drop Workflow Builder</h4>
                        <div class="builder-preview">
                            <div class="builder-personas">
                                <div class="builder-persona">
                                    <i class="fas fa-user-tie" style="color: #3b82f6;"></i>
                                    <span>AE</span>
                                </div>
                                <div class="builder-persona">
                                    <i class="fas fa-handshake" style="color: #10b981;"></i>
                                    <span>Deal Desk</span>
                                </div>
                                <div class="builder-persona">
                                    <i class="fas fa-crown" style="color: #f59e0b;"></i>
                                    <span>CRO</span>
                                </div>
                            </div>
                            <div class="builder-arrow">
                                <i class="fas fa-arrow-right"></i>
                            </div>
                            <div class="builder-workflow">
                                <div class="builder-drop-zone">
                                    Drag personas here to build workflow
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="preview-cta">
                    <button class="btn-primary" onclick="app.initiateGoogleSSO()">
                        <i class="fab fa-google"></i>
                        Sign In to Access Full Quotes System
                    </button>
                    <p>Experience the complete quote management and approval workflow system</p>
                </div>
            </div>
        `;

        // Replace the features section with the preview
        this.contentFeatures.innerHTML = '';
        this.contentFeatures.appendChild(quotesContainer);
    }

    // Update the loadQuotes method to handle authentication better
    async loadQuotes() {
        try {
            const response = await fetch('/api/quotes');
            if (!response.ok) {
                if (response.status === 401) {
                    // Redirect to login or show auth required message
                    document.getElementById('quotesList').innerHTML = `
                        <div class="auth-required">
                            <div class="auth-message">
                                <i class="fas fa-lock"></i>
                                <h3>Session Expired</h3>
                                <p>Please sign in again to access quotes</p>
                                <button class="btn-primary" onclick="app.initiateGoogleSSO()">
                                    <i class="fab fa-google"></i>
                                    Sign In with Google
                                </button>
                            </div>
                        </div>
                    `;
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const quotes = await response.json();
            
            const quotesList = document.getElementById('quotesList');
            quotesList.innerHTML = '';

            if (quotes.length === 0) {
                quotesList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-file-invoice"></i>
                        <h3>No Quotes Found</h3>
                        <p>Create your first quote to get started</p>
                        <button class="btn-primary" onclick="app.createNewQuote()">
                            <i class="fas fa-plus"></i>
                            Create New Quote
                        </button>
                    </div>
                `;
                return;
            }

            quotes.forEach(quote => {
                const quoteCard = this.createQuoteCard(quote);
                quotesList.appendChild(quoteCard);
            });

        } catch (error) {
            console.error('Error loading quotes:', error);
            document.getElementById('quotesList').innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading quotes: ${error.message}</p>
                    <button class="btn-secondary" onclick="app.loadQuotes()">
                        <i class="fas fa-refresh"></i>
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    async handleQuotesTab() {
        try {
            // Check authentication first
            const authResponse = await fetch('/api/user');
            const authData = await authResponse.json();
            
            if (authData.authenticated) {
                // User is authenticated, load full quotes interface
                this.loadQuotesInterface();
            } else {
                // User not authenticated, show preview with sign-in prompt
                this.showQuotesPreview();
            }
        } catch (error) {
            console.error('Error checking auth for quotes:', error);
            this.showQuotesPreview();
        }
    }

    async handleQuotesRedirect() {
        // Check if user is authenticated
        try {
            const authResponse = await fetch('/api/user');
            const authData = await authResponse.json();
            
            if (authData.authenticated) {
                // Add a "Go to Quotes" button in the actions
                this.contentFeatures.innerHTML += `
                    <div class="quotes-redirect-cta">
                        <button class="btn-primary btn-large" onclick="window.location.href='/quotes'">
                            <i class="fas fa-arrow-right"></i>
                            Go to Quotes Management
                    </div>
                `;
            } else {
                // Show sign-in prompt
                this.contentFeatures.innerHTML += `
                    <div class="quotes-signin-cta">
                        <button class="btn-primary btn-large" onclick="app.initiateGoogleSSO()">
                            <i class="fab fa-google"></i>
                            Sign In to Access Quotes
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error checking auth for quotes:', error);
        }
    }

    showQuotesPreview() {
        const quotesContainer = document.createElement('div');
        quotesContainer.className = 'quotes-preview';
        quotesContainer.innerHTML = `
            <div class="preview-content">
                <div class="preview-header">
                    <i class="fas fa-eye"></i>
                    <h3>Quotes Management Preview</h3>
                    <p>Sign in to access the full quotes management system</p>
                </div>
                
                <div class="preview-features">
                    <div class="preview-feature">
                        <i class="fas fa-route"></i>
                        <span>Custom Approval Workflows</span>
                    </div>
                    <div class="preview-feature">
                        <i class="fas fa-users-cog"></i>
                        <span>Role-Based Approvals</span>
                    </div>
                    <div class="preview-feature">
                        <i class="fas fa-arrows-alt"></i>
                        <span>Drag & Drop Workflow Builder</span>
                    </div>
                    <div class="preview-feature">
                        <i class="fas fa-clock"></i>
                        <span>Real-time Status Tracking</span>
                    </div>
                </div>

                <div class="preview-mockup">
                    <div class="mockup-quote-card">
                        <div class="mockup-header">
                            <div>
                                <strong>Q-2025-001</strong>
                                <div class="mockup-customer">Acme Corporation</div>
                            </div>
                            <div class="mockup-details">
                                <span class="mockup-amount">$125,000</span>
                                <span class="mockup-discount">12% discount</span>
                            </div>
                        </div>
                        <div class="mockup-workflow">
                            <div class="mockup-step completed">
                                <i class="fas fa-check"></i>
                                <span>AE</span>
                            </div>
                            <div class="mockup-connector"></div>
                            <div class="mockup-step pending">
                                <i class="fas fa-clock"></i>
                                <span>Deal Desk</span>
                            </div>
                            <div class="mockup-connector"></div>
                            <div class="mockup-step waiting">
                                <i class="fas fa-circle"></i>
                                <span>Customer</span>
                            </div>
                        </div>
                        <div class="mockup-actions">
                            <button class="mockup-btn secondary" disabled>
                                <i class="fas fa-edit"></i>
                                Edit Workflow
                            </button>
                            <button class="mockup-btn primary" disabled>
                                <i class="fas fa-eye"></i>
                                View Details
                            </button>
                        </div>
                    </div>
                    
                    <div class="preview-workflow-builder">
                        <h4>Drag & Drop Workflow Builder</h4>
                        <div class="builder-preview">
                            <div class="builder-personas">
                                <div class="builder-persona">
                                    <i class="fas fa-user-tie" style="color: #3b82f6;"></i>
                                    <span>AE</span>
                                </div>
                                <div class="builder-persona">
                                    <i class="fas fa-handshake" style="color: #10b981;"></i>
                                    <span>Deal Desk</span>
                                </div>
                                <div class="builder-persona">
                                    <i class="fas fa-crown" style="color: #f59e0b;"></i>
                                    <span>CRO</span>
                                </div>
                            </div>
                            <div class="builder-arrow">
                                <i class="fas fa-arrow-right"></i>
                            </div>
                            <div class="builder-workflow">
                                <div class="builder-drop-zone">
                                    Drag personas here to build workflow
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="preview-cta">
                    <button class="btn-primary" onclick="app.initiateGoogleSSO()">
                        <i class="fab fa-google"></i>
                        Sign In to Access Full Quotes System
                    </button>
                    <p>Experience the complete quote management and approval workflow system</p>
                </div>
            </div>
        `;

        // Replace the features section with the preview
        this.contentFeatures.innerHTML = '';
        this.contentFeatures.appendChild(quotesContainer);
    }

    // Update the loadQuotes method to handle authentication better
    async loadQuotes() {
        try {
            const response = await fetch('/api/quotes');
            if (!response.ok) {
                if (response.status === 401) {
                    // Redirect to login or show auth required message
                    document.getElementById('quotesList').innerHTML = `
                        <div class="auth-required">
                            <div class="auth-message">
                                <i class="fas fa-lock"></i>
                                <h3>Session Expired</h3>
                                <p>Please sign in again to access quotes</p>
                                <button class="btn-primary" onclick="app.initiateGoogleSSO()">
                                    <i class="fab fa-google"></i>
                                    Sign In with Google
                                </button>
                            </div>
                        </div>
                    `;
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const quotes = await response.json();
            
            const quotesList = document.getElementById('quotesList');
            quotesList.innerHTML = '';

            if (quotes.length === 0) {
                quotesList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-file-invoice"></i>
                        <h3>No Quotes Found</h3>
                        <p>Create your first quote to get started</p>
                        <button class="btn-primary" onclick="app.createNewQuote()">
                            <i class="fas fa-plus"></i>
                            Create New Quote
                        </button>
                    </div>
                `;
                return;
            }

            quotes.forEach(quote => {
                const quoteCard = this.createQuoteCard(quote);
                quotesList.appendChild(quoteCard);
            });

        } catch (error) {
            console.error('Error loading quotes:', error);
            document.getElementById('quotesList').innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading quotes: ${error.message}</p>
                    <button class="btn-secondary" onclick="app.loadQuotes()">
                        <i class="fas fa-refresh"></i>
                        Try Again
                    </button>
                </div>
            `;
        }
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

    async loadQuotesInterface() {
        try {
            // Create quotes interface container
            const quotesContainer = document.createElement('div');
            quotesContainer.className = 'quotes-interface';
            quotesContainer.innerHTML = `
                <div class="quotes-header">
                    <div class="quotes-actions">
                        <button class="btn-primary" id="createNewQuote">
                            <i class="fas fa-plus"></i>
                            Create New Quote
                        </button>
                        <div class="quotes-filters">
                            <select id="statusFilter" class="filter-select">
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="quotes-list" id="quotesList">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        Loading quotes...
                    </div>
                </div>
            `;

            // Replace content features with quotes interface
            this.contentFeatures.innerHTML = '';
            this.contentFeatures.appendChild(quotesContainer);

            // Load quotes data
            await this.loadQuotes();

            // Setup event listeners
            this.setupQuotesEventListeners();

        } catch (error) {
            console.error('Error loading quotes interface:', error);
        }
    }

    async loadQuotes() {
        try {
            const response = await fetch('/api/quotes');
            const quotes = await response.json();
            
            const quotesList = document.getElementById('quotesList');
            quotesList.innerHTML = '';

            quotes.forEach(quote => {
                const quoteCard = this.createQuoteCard(quote);
                quotesList.appendChild(quoteCard);
            });

        } catch (error) {
            console.error('Error loading quotes:', error);
            document.getElementById('quotesList').innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    Error loading quotes. Please try again.
                </div>
            `;
        }
    }

    createQuoteCard(quote) {
        const card = document.createElement('div');
        card.className = 'quote-card';
        card.innerHTML = `
            <div class="quote-header">
                <div class="quote-info">
                    <h3 class="quote-id">${quote.id}</h3>
                    <p class="quote-customer">${quote.customer}</p>
                    <div class="quote-meta">
                        <span class="quote-amount">$${quote.amount.toLocaleString()}</span>
                        <span class="quote-discount">${quote.discount}% discount</span>
                        <span class="quote-date">${new Date(quote.createdDate).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="quote-actions">
                    <button class="btn-secondary btn-sm" onclick="app.editWorkflow('${quote.id}')">
                        <i class="fas fa-edit"></i>
                        Edit Workflow
                    </button>
                    <button class="btn-primary btn-sm" onclick="app.viewQuote('${quote.id}')">
                        <i class="fas fa-eye"></i>
                        View
                    </button>
                </div>
            </div>
            <div class="quote-workflow">
                <div class="workflow-progress">
                    ${this.createWorkflowProgress(quote.workflow, quote.currentStep)}
                </div>
            </div>
            <div class="quote-details">
                <div class="quote-products">
                    <strong>Products:</strong> ${quote.products.join(', ')}
                </div>
                <div class="quote-creator">
                    <strong>Created by:</strong> ${quote.createdBy}
                </div>
            </div>
        `;
        return card;
    }

    createWorkflowProgress(workflow, currentStep) {
        return workflow.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.status === 'completed';
            const isPending = step.status === 'pending';
            
            let statusClass = 'waiting';
            if (isCompleted) statusClass = 'completed';
            else if (isPending) statusClass = 'pending';
            else if (isActive) statusClass = 'active';

            return `
                <div class="workflow-step ${statusClass}" data-step="${step.id}">
                    <div class="step-icon">
                        ${isCompleted ? '<i class="fas fa-check"></i>' : 
                        isPending ? '<i class="fas fa-clock"></i>' : 
                        '<i class="fas fa-circle"></i>'}
                    </div>
                    <div class="step-info">
                        <div class="step-name">${step.name}</div>
                        <div class="step-assignee">${step.assignee}</div>
                        ${step.completedDate ? `<div class="step-date">Completed: ${new Date(step.completedDate).toLocaleDateString()}</div>` : ''}
                    </div>
                    ${index < workflow.length - 1 ? '<div class="step-connector"></div>' : ''}
                </div>
            `;
        }).join('');
    }

    setupQuotesEventListeners() {
        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filterQuotes(e.target.value);
            });
        }

        // Create new quote button
        const createNewQuote = document.getElementById('createNewQuote');
        if (createNewQuote) {
            createNewQuote.addEventListener('click', () => {
                this.createNewQuote();
            });
        }
    }

    filterQuotes(status) {
        const quoteCards = document.querySelectorAll('.quote-card');
        quoteCards.forEach(card => {
            if (!status) {
                card.style.display = 'block';
            } else {
                // This would need to be implemented based on quote status
                // For now, show all cards
                card.style.display = 'block';
            }
        });
    }

    editWorkflow(quoteId) {
        this.showWorkflowEditor(quoteId);
    }

    async showWorkflowEditor(quoteId) {
        try {
            // Fetch current quote data
            const quotesResponse = await fetch('/api/quotes');
            const quotes = await quotesResponse.json();
            const quote = quotes.find(q => q.id === quoteId);

            // Fetch available personas
            const personasResponse = await fetch('/api/workflow-personas');
            const personas = await personasResponse.json();

            if (!quote) {
                throw new Error('Quote not found');
            }

            // Create modal
            const modal = document.createElement('div');
            modal.className = 'workflow-modal';
            modal.innerHTML = `
                <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Edit Workflow - ${quote.id}</h3>
                        <button class="modal-close" onclick="this.closest('.workflow-modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="workflow-editor">
                            <div class="personas-panel">
                                <h4>Available Personas</h4>
                                <div class="personas-list" id="personasList">
                                    ${personas.map(persona => `
                                        <div class="persona-item" draggable="true" data-persona-id="${persona.id}">
                                            <div class="persona-icon" style="color: ${persona.color}">
                                                <i class="${persona.icon}"></i>
                                            </div>
                                            <div class="persona-info">
                                                <div class="persona-name">${persona.name}</div>
                                                <div class="persona-description">${persona.description}</div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="workflow-builder">
                                <h4>Workflow Steps</h4>
                                <div class="workflow-steps" id="workflowSteps">
                                    ${quote.workflow.map((step, index) => `
                                        <div class="workflow-step-editor" data-step-id="${step.id}">
                                            <div class="step-handle">
                                                <i class="fas fa-grip-vertical"></i>
                                            </div>
                                            <div class="step-content">
                                                <div class="step-name">${step.name}</div>
                                                <div class="step-assignee">${step.assignee}</div>
                                            </div>
                                            <div class="step-actions">
                                                <button class="btn-danger btn-sm" onclick="this.closest('.workflow-step-editor').remove()">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="workflow-drop-zone" id="workflowDropZone">
                                    <i class="fas fa-plus"></i>
                                    Drag personas here to add workflow steps
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="this.closest('.workflow-modal').remove()">
                            Cancel
                        </button>
                        <button class="btn-primary" onclick="app.saveWorkflow('${quoteId}')">
                            Save Workflow
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.setupWorkflowDragAndDrop();

        } catch (error) {
            console.error('Error showing workflow editor:', error);
            alert('Error loading workflow editor. Please try again.');
        }
    }

    async addWorkflowStep(personaId) {
        try {
            const personasResponse = await fetch('/api/workflow-personas');
            const personas = await personasResponse.json();
            const persona = personas.find(p => p.id === personaId);

            if (!persona) return;

            const workflowSteps = document.getElementById('workflowSteps');
            const stepElement = document.createElement('div');
            stepElement.className = 'workflow-step-editor';
            stepElement.dataset.stepId = persona.id;
            stepElement.innerHTML = `
                <div class="step-handle">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <div class="step-content">
                    <div class="step-name">${persona.name}</div>
                    <div class="step-assignee">Unassigned</div>
                </div>
                <div class="step-actions">
                    <button class="btn-danger btn-sm" onclick="this.closest('.workflow-step-editor').remove()">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            workflowSteps.appendChild(stepElement);

        } catch (error) {
            console.error('Error adding workflow step:', error);
        }
    }

    setupWorkflowSorting() {
        const workflowSteps = document.getElementById('workflowSteps');
        if (!workflowSteps) return;

        let draggedElement = null;

        workflowSteps.addEventListener('dragstart', (e) => {
            if (e.target.closest('.workflow-step-editor')) {
                draggedElement = e.target.closest('.workflow-step-editor');
                draggedElement.classList.add('dragging');
            }
        });

        workflowSteps.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(workflowSteps, e.clientY);
            if (afterElement == null) {
                workflowSteps.appendChild(draggedElement);
            } else {
                workflowSteps.insertBefore(draggedElement, afterElement);
            }
        });

        workflowSteps.addEventListener('dragend', () => {
            if (draggedElement) {
                draggedElement.classList.remove('dragging');
                draggedElement = null;
            }
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.workflow-step-editor:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    viewQuote(quoteId) {
        // This would open a detailed quote view
        console.log('Viewing quote:', quoteId);
        alert(`Quote ${quoteId} details would open here.`);
    }

    createNewQuote() {
        // This would open the quote creation interface
        console.log('Creating new quote');
        alert('New quote creation interface would open here.');
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
