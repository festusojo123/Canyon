class CreateQuoteApp {
    constructor() {
        this.products = [];
        this.selectedProducts = [];
        this.productCatalog = [];
        this.init();
    }

    setupElements() {
        this.form = document.getElementById('quoteForm');
        this.userMenu = document.getElementById('userMenu');
        this.userName = document.getElementById('userName');
        this.addProductBtn = document.getElementById('addProduct');
        this.productModal = document.getElementById('productModal');
        this.closeModalBtn = document.getElementById('closeModal');
        this.productSearch = document.getElementById('productSearch');
        this.productCatalog = document.getElementById('productCatalog');
        this.productsList = document.getElementById('productsList');
        this.saveAsDraftBtn = document.getElementById('saveAsDraft');
        this.submitQuoteBtn = document.getElementById('submitQuote');
        
        // Summary elements
        this.subtotalAmount = document.getElementById('subtotalAmount');
        this.discountAmount = document.getElementById('discountAmount');
        this.totalAmount = document.getElementById('totalAmount');
    }

    setupEventListeners() {
        this.addProductBtn.addEventListener('click', () => this.openProductModal());
        this.closeModalBtn.addEventListener('click', () => this.closeProductModal());
        this.productModal.addEventListener('click', (e) => {
            if (e.target === this.productModal) this.closeProductModal();
        });
        this.productSearch.addEventListener('input', (e) => this.filterProducts(e.target.value));
        this.saveAsDraftBtn.addEventListener('click', () => this.saveAsDraft());
        this.submitQuoteBtn.addEventListener('click', () => this.submitQuote());
        this.userMenu.addEventListener('click', () => this.showUserMenu());
        
        // Form validation
        this.form.addEventListener('input', () => this.validateForm());
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
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;
            case 'analytics':
                window.location.href = '/insights';
                break;
            case 'support':
                window.location.href = '/dashboard';
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
            this.userName.textContent = 'Demo User';
        }
    }

    renderProductCatalog(filteredProducts = null) {
        const products = filteredProducts || this.productCatalog;
        
        this.productCatalog.innerHTML = products.map(product => `
            <div class="catalog-item" data-product-id="${product.id}">
                <div class="category">${product.category}</div>
                <h4>${product.name}</h4>
                <p class="description">${product.description}</p>
                <div class="price">$${product.basePrice.toLocaleString()}</div>
                <div class="features">
                    ${product.features.map(feature => `
                        <span class="feature-tag">${feature}</span>
                    `).join('')}
                </div>
            </div>
        `).join('');

        // Add click listeners
        this.productCatalog.querySelectorAll('.catalog-item').forEach(item => {
            item.addEventListener('click', () => {
                const productId = item.getAttribute('data-product-id');
                this.addProductToQuote(productId);
            });
        });
    }

    filterProducts(searchTerm) {
        if (!searchTerm) {
            this.renderProductCatalog();
            return;
        }

        const filtered = this.productCatalog.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase())
        );

        this.renderProductCatalog(filtered);
    }

    openProductModal() {
        this.productModal.classList.add('show');
        this.productSearch.focus();
    }

    closeProductModal() {
        this.productModal.classList.remove('show');
        this.productSearch.value = '';
        this.renderProductCatalog();
    }

    addProductToQuote(productId) {
        const product = this.productCatalog.find(p => p.id === productId);
        if (!product) return;

        // Check if product already exists
        const existingIndex = this.selectedProducts.findIndex(p => p.id === productId);
        if (existingIndex !== -1) {
            this.selectedProducts[existingIndex].quantity += 1;
        } else {
            this.selectedProducts.push({
                ...product,
                quantity: 1,
                discount: 0
            });
        }

        this.renderSelectedProducts();
        this.updateSummary();
        this.closeProductModal();
        this.showNotification(`${product.name} added to quote`, 'success');
    }

    renderSelectedProducts() {
        if (this.selectedProducts.length === 0) {
            this.productsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <p>No products selected. Click "Add Product" to get started.</p>
                </div>
            `;
            return;
        }

        this.productsList.innerHTML = this.selectedProducts.map((product, index) => `
            <div class="product-item">
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p>${product.description}</p>
                </div>
                <div class="product-quantity">
                    <label>Qty:</label>
                    <input type="number" class="quantity-input" value="${product.quantity}" min="1" 
                           onchange="window.createQuoteApp.updateProductQuantity(${index}, this.value)">
                </div>
                <div class="product-price">
                    $${product.basePrice.toLocaleString()}
                </div>
                <div class="product-discount">
                    <input type="number" value="${product.discount}" min="0" max="100" 
                           placeholder="Discount %" 
                           onchange="window.createQuoteApp.updateProductDiscount(${index}, this.value)">
                    <span>% off</span>
                </div>
                <div class="product-total">
                    $${this.calculateLineTotal(product).toLocaleString()}
                </div>
                <button type="button" class="remove-product" 
                        onclick="window.createQuoteApp.removeProduct(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    updateProductQuantity(index, quantity) {
        this.selectedProducts[index].quantity = parseInt(quantity) || 1;
        this.renderSelectedProducts();
        this.updateSummary();
    }

    updateProductDiscount(index, discount) {
        this.selectedProducts[index].discount = parseFloat(discount) || 0;
        this.renderSelectedProducts();
        this.updateSummary();
    }

    removeProduct(index) {
        const product = this.selectedProducts[index];
        this.selectedProducts.splice(index, 1);
        this.renderSelectedProducts();
        this.updateSummary();
        this.showNotification(`${product.name} removed from quote`, 'info');
    }

    calculateLineTotal(product) {
        const lineSubtotal = product.basePrice * product.quantity;
        const discountAmount = lineSubtotal * (product.discount / 100);
        return lineSubtotal - discountAmount;
    }

    updateSummary() {
        let subtotal = 0;
        let totalDiscount = 0;

        this.selectedProducts.forEach(product => {
            const lineSubtotal = product.basePrice * product.quantity;
            const discountAmount = lineSubtotal * (product.discount / 100);
            subtotal += lineSubtotal;
            totalDiscount += discountAmount;
        });

        const total = subtotal - totalDiscount;

        this.subtotalAmount.textContent = `$${subtotal.toLocaleString()}`;
        this.discountAmount.textContent = `$${totalDiscount.toLocaleString()}`;
        this.totalAmount.textContent = `$${total.toLocaleString()}`;
    }

    setDefaultValidDate() {
        const validUntilInput = document.getElementById('validUntil');
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 30); // 30 days from now
        validUntilInput.value = defaultDate.toISOString().split('T')[0];
    }

    validateForm() {
        const requiredFields = this.form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
            }
        });

        if (this.selectedProducts.length === 0) {
            isValid = false;
        }

        this.submitQuoteBtn.disabled = !isValid;
        return isValid;
    }

    async saveAsDraft() {
        if (!this.validateForm()) {
            this.showNotification('Please fill in all required fields and add at least one product', 'error');
            return;
        }

        this.showNotification('Saving draft...', 'info');
        
        // Simulate saving
        setTimeout(() => {
            this.showNotification('Quote saved as draft successfully!', 'success');
        }, 1000);
    }

    async submitQuote() {
        if (!this.validateForm()) {
            this.showNotification('Please fill in all required fields and add at least one product', 'error');
            return;
        }

        const formData = new FormData(this.form);
        const quoteData = {
            customer: {
                name: formData.get('customerName'),
                contactName: formData.get('contactName'),
                email: formData.get('contactEmail'),
                phone: formData.get('contactPhone'),
                address: formData.get('customerAddress')
            },
            title: formData.get('quoteTitle'),
            validUntil: formData.get('validUntil'),
            products: this.selectedProducts,
            notes: formData.get('quoteNotes')
        };

        try {
            this.showNotification('Submitting quote...', 'info');
            
            const response = await fetch('/api/quotes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(quoteData)
            });

            const result = await response.json();

            if (response.ok) {
                this.showNotification(result.message, 'success');
                setTimeout(() => {
                    window.location.href = '/quotes';
                }, 2000);
            } else {
                this.showNotification(result.error || 'Failed to create quote', 'error');
            }
        } catch (error) {
            console.error('Error submitting quote:', error);
            this.showNotification('Failed to submit quote. Please try again.', 'error');
        }
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
                .empty-state {
                    text-align: center;
                    padding: 3rem;
                    color: #9ca3af;
                }
                .empty-state i {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                    opacity: 0.5;
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

    setupAIEventListeners() {
        this.generateQuoteBtn = document.getElementById('generateQuote');
        this.clearPromptBtn = document.getElementById('clearPrompt');
        this.aiPrompt = document.getElementById('aiPrompt');
        this.aiResults = document.getElementById('aiResults');
        this.aiLoading = document.getElementById('aiLoading');
        this.aiStatus = document.getElementById('aiStatus');
        
        this.generateQuoteBtn.addEventListener('click', () => this.generateAIQuote());
        this.clearPromptBtn.addEventListener('click', () => this.clearPrompt());
        
        // AI Results buttons
        document.getElementById('acceptAIQuote')?.addEventListener('click', () => this.acceptAIQuote());
        document.getElementById('modifyAIQuote')?.addEventListener('click', () => this.modifyAIQuote());
        document.getElementById('regenerateQuote')?.addEventListener('click', () => this.regenerateAIQuote());
    }

    useExamplePrompt(button) {
        this.aiPrompt.value = button.textContent.replace(/"/g, '');
        this.aiPrompt.focus();
    }

    clearPrompt() {
        this.aiPrompt.value = '';
        this.hideAIResults();
        this.aiPrompt.focus();
    }

    async generateAIQuote() {
        const prompt = this.aiPrompt.value.trim();
        if (!prompt) {
            this.showNotification('Please enter a description of what the customer needs', 'error');
            return;
        }

        this.showAILoading();
        this.updateAIStatus('processing', 'Processing...');

        try {
            // Get customer context if available
            const customerContext = {
                name: document.getElementById('customerName').value,
                email: document.getElementById('contactEmail').value,
                contact: document.getElementById('contactName').value
            };

            const response = await fetch('/api/quotes/generate-ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt,
                    customerContext: customerContext
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.displayAIResults(result);
                this.updateAIStatus('ready', 'Quote Generated');
                this.showNotification('AI quote generated successfully!', 'success');
            } else {
                throw new Error(result.error || 'Failed to generate quote');
            }
        } catch (error) {
            console.error('Error generating AI quote:', error);
            this.updateAIStatus('error', 'Generation Failed');
            this.showNotification('Failed to generate quote. Please try again.', 'error');
            this.hideAILoading();
        }
    }

    showAILoading() {
        this.aiLoading.style.display = 'flex';
        this.aiResults.style.display = 'none';
        this.generateQuoteBtn.disabled = true;

        // Simulate loading steps
        const steps = [
            'Processing natural language input...',
            'Analyzing customer requirements...',
            'Matching products and services...',
            'Calculating pricing and discounts...',
            'Generating recommendations...',
            'Finalizing quote structure...'
        ];

        let stepIndex = 0;
        const stepInterval = setInterval(() => {
            if (stepIndex < steps.length) {
                document.getElementById('loadingStep').textContent = steps[stepIndex];
                stepIndex++;
            } else {
                clearInterval(stepInterval);
            }
        }, 300);

        // Store interval for cleanup
        this.loadingInterval = stepInterval;
    }

    hideAILoading() {
        this.aiLoading.style.display = 'none';
        this.generateQuoteBtn.disabled = false;
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
        }
    }

    displayAIResults(result) {
        this.hideAILoading();
        this.aiResults.style.display = 'block';
        this.currentAIQuote = result.quote;

        // Update confidence score
        const confidence = Math.round(result.confidence * 100);
        document.getElementById('confidencePercent').textContent = `${confidence}%`;
        document.getElementById('confidenceFill').style.width = `${confidence}%`;

        // Update reasoning
        document.getElementById('aiReasoning').textContent = result.quote.aiInsights.reasoning;

        // Update suggestions
        const suggestionsList = document.getElementById('aiSuggestions');
        suggestionsList.innerHTML = result.suggestions.map(suggestion => 
            `<li>${suggestion}</li>`
        ).join('');

        // Update risks (if any)
        const riskFactors = result.quote.aiInsights.riskFactors || [];
        const risksCard = document.getElementById('risksCard');
        if (riskFactors.length > 0) {
            risksCard.style.display = 'block';
            const risksList = document.getElementById('aiRisks');
            risksList.innerHTML = riskFactors.map(risk => `<li>${risk}</li>`).join('');
        } else {
            risksCard.style.display = 'none';
        }

        // Update opportunities
        const opportunitiesList = document.getElementById('aiOpportunities');
        opportunitiesList.innerHTML = result.quote.aiInsights.opportunities.map(opportunity => 
            `<li>${opportunity}</li>`
        ).join('');

        // Scroll to results
        this.aiResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    acceptAIQuote() {
        if (!this.currentAIQuote) return;

        // Replace current products with AI generated ones
        this.selectedProducts = this.currentAIQuote.products.map(product => ({
            ...product,
            // Remove AI-specific fields
            aiReasoning: undefined
        }));

        this.renderSelectedProducts();
        this.updateSummary();
        this.hideAIResults();
        
        this.showNotification('AI quote accepted and loaded into the form', 'success');
        
        // Scroll to products section
        document.getElementById('productsList').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    modifyAIQuote() {
        if (!this.currentAIQuote) return;

        // Add AI products to existing selection (don't replace)
        this.currentAIQuote.products.forEach(aiProduct => {
            const existingIndex = this.selectedProducts.findIndex(p => p.id === aiProduct.id);
            if (existingIndex !== -1) {
                // Update existing product
                this.selectedProducts[existingIndex] = {
                    ...this.selectedProducts[existingIndex],
                    ...aiProduct,
                    aiReasoning: undefined
                };
            } else {
                // Add new product
                this.selectedProducts.push({
                    ...aiProduct,
                    aiReasoning: undefined
                });
            }
        });

        this.renderSelectedProducts();
        this.updateSummary();
        this.hideAIResults();
        
        this.showNotification('AI suggestions added. You can now modify the quote as needed.', 'success');
        
        // Scroll to products section
        document.getElementById('productsList').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    regenerateAIQuote() {
        this.showNotification('Regenerating quote with AI...', 'info');
        this.generateAIQuote();
    }

    hideAIResults() {
        this.aiResults.style.display = 'none';
        this.currentAIQuote = null;
    }

    updateAIStatus(status, text) {
        const indicator = this.aiStatus.querySelector('.status-indicator');
        const statusText = this.aiStatus.querySelector('span:last-child');
        
        indicator.className = `status-indicator ${status}`;
        statusText.textContent = text;
    }

    // Update the init method to include AI listeners
    async init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupAIEventListeners(); // Add this line
        this.setupSidebarNavigation();
        await this.checkAuthentication();
        await this.loadProductCatalog();
        this.setDefaultValidDate();
    }

}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.createQuoteApp = new CreateQuoteApp();
});
