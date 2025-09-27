class QuotesApp {
    constructor() {
        this.quotes = [];
        this.filteredQuotes = [];
        this.init();
    }

    async init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupSidebarNavigation();
        await this.checkAuthentication();
        await this.loadQuotes();
        this.updateStats();
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
                window.location.href = '/dashboard';
                break;
            case 'quotes':
                // Already on quotes page - scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;
            case 'create-quotes':
                window.location.href = '/quotes/create';
                break;
            case 'insights':
                window.location.href = '/insights';
                break;
            case 'support':
                window.location.href = '/support';
                break;
            default:
                console.log('Unknown tab:', tabType);
        }
    }

    setupElements() {
        this.quotesList = document.getElementById('quotesList');
        this.searchInput = document.getElementById('searchQuotes');
        this.statusFilter = document.getElementById('statusFilter');
        this.sortBy = document.getElementById('sortBy');
        this.refreshBtn = document.getElementById('refreshQuotes');
        this.createBtn = document.getElementById('createNewQuote');
        this.userMenu = document.getElementById('userMenu');
        this.userName = document.getElementById('userName');
    }

    setupEventListeners() {
        this.searchInput.addEventListener('input', () => this.filterQuotes());
        this.statusFilter.addEventListener('change', () => this.filterQuotes());
        this.sortBy.addEventListener('change', () => this.sortQuotes());
        this.refreshBtn.addEventListener('click', () => this.loadQuotes());
        this.createBtn.addEventListener('click', () => this.createNewQuote());
        
        // User menu click
        this.userMenu.addEventListener('click', () => this.showUserMenu());
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
            window.location.href = '/?error=auth_error';
        }
    }

    async loadQuotes() {
        try {
            this.quotesList.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    Loading quotes...
                </div>
            `;

            const response = await fetch('/api/quotes');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.quotes = await response.json();
            this.filteredQuotes = [...this.quotes];
            this.renderQuotes();
            this.updateStats();

        } catch (error) {
            console.error('Error loading quotes:', error);
            this.quotesList.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Quotes</h3>
                    <p>There was an error loading your quotes. Please try again.</p>
                    <button class="btn-primary" onclick="quotesApp.loadQuotes()">
                        <i class="fas fa-refresh"></i>
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    renderQuotes() {
        if (this.filteredQuotes.length === 0) {
            this.quotesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-invoice"></i>
                    <h3>No Quotes Found</h3>
                    <p>Create your first quote to get started with the approval workflow system</p>
                    <button class="btn-primary" onclick="quotesApp.createNewQuote()">
                        <i class="fas fa-plus"></i>
                        Create New Quote
                    </button>
                </div>
            `;
            return;
        }

        this.quotesList.innerHTML = '';
        this.filteredQuotes.forEach(quote => {
            const quoteCard = this.createQuoteCard(quote);
            this.quotesList.appendChild(quoteCard);
        });
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
                        <span class="quote-date">Created: ${new Date(quote.createdDate).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="quote-actions">
                    <button class="btn-secondary btn-sm" onclick="quotesApp.editWorkflow('${quote.id}')">
                        <i class="fas fa-edit"></i>
                        Edit Workflow
                    </button>
                    <button class="btn-primary btn-sm" onclick="quotesApp.viewQuote('${quote.id}')">
                        <i class="fas fa-eye"></i>
                        View Details
                    </button>
                </div>
            </div>
            <div class="quote-workflow">
                <div class="workflow-progress">
                    ${this.createWorkflowProgress(quote.workflow, quote.currentStep)}
                </div>
            </div>
            <div class="quote-details">
                <div class="quote-detail-item">
                    <div class="quote-detail-label">Products:</div>
                    <div>${quote.products.join(', ')}</div>
                </div>
                <div class="quote-detail-item">
                    <div class="quote-detail-label">Created by:</div>
                    <div>${quote.createdBy}</div>
                </div>
                <div class="quote-detail-item">
                    <div class="quote-detail-label">Current Step:</div>
                    <div>${quote.workflow.find(s => s.id === quote.currentStep)?.name || 'Unknown'}</div>
                </div>
                <div class="quote-detail-item">
                    <div class="quote-detail-label">Status:</div>
                    <div class="status-badge ${quote.status}">${quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}</div>
                </div>
            </div>
        `;
        return card;
    }

    createQuoteCard(quote) {
        this.currentQuoteId = quote.id; // Set current quote ID for workflow actions
        
        const card = document.createElement('div');
        card.className = 'quote-card';
        card.dataset.quoteId = quote.id; // Add quote ID to card
        card.innerHTML = `
            <div class="quote-header">
                <div class="quote-info">
                    <h3 class="quote-id">${quote.id}</h3>
                    <p class="quote-customer">${quote.customer}</p>
                    <div class="quote-meta">
                        <span class="quote-amount">$${quote.amount.toLocaleString()}</span>
                        <span class="quote-discount">${quote.discount}% discount</span>
                        <span class="quote-date">Created: ${new Date(quote.createdDate).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="quote-actions">
                    <button class="btn-secondary btn-sm" onclick="quotesApp.editWorkflow('${quote.id}')">
                        <i class="fas fa-edit"></i>
                        Edit Workflow
                    </button>
                    <button class="btn-primary btn-sm" onclick="quotesApp.viewQuote('${quote.id}')">
                        <i class="fas fa-eye"></i>
                        View Details
                    </button>
                </div>
            </div>
            <div class="quote-workflow">
                <div class="workflow-progress">
                    ${this.createWorkflowProgress(quote.workflow, quote.currentStep, quote.id)}
                </div>
            </div>
            <!-- rest of card content -->
        `;
        return card;
    }

        createWorkflowProgress(workflow, currentStep, quoteId) {
        return workflow.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.status === 'completed';
            const isPending = step.status === 'pending';
            
            let statusClass = 'waiting';
            if (isCompleted) statusClass = 'completed';
            else if (isPending) statusClass = 'pending';
            else if (isActive) statusClass = 'active';

            return `
                <div class="workflow-step ${statusClass} ${step.id}" data-step="${step.id}">
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
                    ${(isPending || isActive) ? `
                        <div class="step-actions">
                            <button class="btn-complete" onclick="quotesApp.markStepComplete('${quoteId}', '${step.id}')" title="Mark Complete">
                                <i class="fas fa-check"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
                ${index < workflow.length - 1 ? '<div class="step-connector"></div>' : ''}
            `;
        }).join('');
    }

    async markStepComplete(quoteId, stepId) {
    try {
        // Find the quote
        const quote = this.quotes.find(q => q.id === quoteId);
        if (!quote) {
            throw new Error('Quote not found');
            return;
        }

        // Find the step in the workflow
        const stepIndex = quote.workflow.findIndex(step => step.id === stepId);
        if (stepIndex === -1) {
            throw new Error('Workflow step not found');
            return;
        }

        // Update the step status
        quote.workflow[stepIndex].status = 'completed';
        quote.workflow[stepIndex].completedDate = new Date().toISOString().split('T')[0];

        // Find the next step and make it active/pending
        const nextStepIndex = stepIndex + 1;
        if (nextStepIndex < quote.workflow.length) {
            quote.workflow[nextStepIndex].status = 'pending';
            quote.currentStep = quote.workflow[nextStepIndex].id;
        } else {
            // All steps completed
            quote.status = 'approved';
            quote.currentStep = null;
        }

        // Send update to server
        const response = await fetch(`/api/quotes/${quoteId}/workflow`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ workflow: quote.workflow })
        });

        if (!response.ok) {
            throw new Error('Failed to update workflow');
        }

        // Update local data
        const result = await response.json();
        const quoteIndex = this.quotes.findIndex(q => q.id === quoteId);
        if (quoteIndex !== -1) {
            this.quotes[quoteIndex] = result.quote;
        }

        // Refresh the display
        this.filterQuotes();
        this.showNotification(`Step "${quote.workflow[stepIndex].name}" marked as complete!`, 'success');

        } catch (error) {
            console.error('Error marking step complete:', error);
            this.showNotification(error.message || 'Error updating workflow step', 'error');
        }
    }

    getQuoteIdFromCard(step) {
        return this.currentQuoteId; // We'll set this in createQuoteCard
    }

    filterQuotes() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const statusFilter = this.statusFilter.value;

        this.filteredQuotes = this.quotes.filter(quote => {
            const matchesSearch = !searchTerm || 
                quote.id.toLowerCase().includes(searchTerm) ||
                quote.customer.toLowerCase().includes(searchTerm) ||
                quote.amount.toString().includes(searchTerm);

            const matchesStatus = !statusFilter || quote.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        this.sortQuotes();
        this.renderQuotes();
    }

    sortQuotes() {
        const sortBy = this.sortBy.value;

        this.filteredQuotes.sort((a, b) => {
            switch (sortBy) {
                case 'date-desc':
                    return new Date(b.createdDate) - new Date(a.createdDate);
                case 'date-asc':
                    return new Date(a.createdDate) - new Date(b.createdDate);
                case 'amount-desc':
                    return b.amount - a.amount;
                case 'amount-asc':
                    return a.amount - b.amount;
                case 'customer':
                    return a.customer.localeCompare(b.customer);
                default:
                    return 0;
            }
        });
    }

    updateStats() {
        const totalQuotes = this.quotes.length;
        const pendingQuotes = this.quotes.filter(q => q.status === 'pending').length;
        const approvedQuotes = this.quotes.filter(q => q.status === 'approved').length;
        const totalValue = this.quotes.reduce((sum, q) => sum + q.amount, 0);

        document.getElementById('totalQuotes').textContent = totalQuotes;
        document.getElementById('pendingQuotes').textContent = pendingQuotes;
        document.getElementById('approvedQuotes').textContent = approvedQuotes;
        document.getElementById('totalValue').textContent = `$${totalValue.toLocaleString()}`;
    }

    editWorkflow(quoteId) {
        this.showWorkflowEditor(quoteId);
    }

async showWorkflowEditor(quoteId) {
    try {
        const quote = this.quotes.find(q => q.id === quoteId);
        const personasResponse = await fetch('/api/workflow-personas');
        const personas = await personasResponse.json();

        if (!quote) {
            throw new Error('Quote not found');
        }

        const modal = document.createElement('div');
        modal.className = 'workflow-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="quotesApp.closeWorkflowModal()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Workflow - ${quote.id}</h3>
                    <button class="modal-close" onclick="quotesApp.closeWorkflowModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="workflow-editor">
                        <div class="personas-panel">
                            <h4>Available Workflow Steps</h4>
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
                            <h4>Current Workflow</h4>
                            <div class="workflow-steps" id="workflowSteps">
                                ${quote.workflow.map((step, index) => `
                                    <div class="workflow-step-editor" draggable="true" data-step-id="${step.id}">
                                        <div class="step-handle">
                                            <i class="fas fa-grip-vertical"></i>
                                        </div>
                                        <div class="step-content">
                                            <div class="step-name">${step.name}</div>
                                            <div class="step-assignee">${step.assignee}</div>
                                            <input type="text" class="assignee-input" placeholder="Enter assignee name" style="display: none;">
                                        </div>
                                        <div class="step-actions">
                                            <button class="btn-secondary btn-xs" onclick="quotesApp.editAssignee(this)" title="Edit Assignee">
                                                <i class="fas fa-user-edit"></i>
                                            </button>
                                            <button class="btn-danger btn-xs" onclick="quotesApp.removeWorkflowStep(this)" title="Remove Step">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="workflow-drop-zone" id="workflowDropZone">
                                <i class="fas fa-plus"></i>
                                Drag workflow steps here to add them
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="quotesApp.closeWorkflowModal()">
                        Cancel
                    </button>
                    <button class="btn-primary" onclick="quotesApp.saveWorkflow('${quoteId}')">
                        <i class="fas fa-save"></i>
                        Save Workflow
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Add initial fade-in animation
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.transition = 'opacity 0.3s ease';
            modal.style.opacity = '1';
        }, 10);
        
        // Wait for the modal to be fully rendered before setting up drag and drop
        setTimeout(() => {
            this.setupWorkflowDragAndDrop();
        }, 100);
            
        } catch (error) {
            console.error('Error showing workflow editor:', error);
            this.showNotification('Error loading workflow editor. Please try again.', 'error');
        }
    }

        async saveWorkflow(quoteId) {
    try {
        const saveButton = document.querySelector('.modal-footer .btn-primary');
        if (!saveButton) {
            console.error('Save button not found');
            return;
        }

        const originalText = saveButton.innerHTML;
        
        // Show loading state
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveButton.disabled = true;

        const workflowSteps = document.querySelectorAll('.workflow-step-editor');
        
        if (workflowSteps.length === 0) {
            throw new Error('Workflow must have at least one step');
        }

        console.log('Found workflow steps:', workflowSteps.length);

        const workflow = Array.from(workflowSteps).map((step, index) => {
            const stepId = step.dataset.stepId;
            const stepName = step.querySelector('.step-name').textContent;
            const assignee = step.querySelector('.step-assignee').textContent;
            
            return {
                id: stepId,
                name: stepName,
                status: index === 0 ? 'completed' : 'waiting',
                assignee: assignee === 'Unassigned' ? this.getDefaultAssignee(stepId) : assignee,
                completedDate: index === 0 ? new Date().toISOString().split('T')[0] : null
            };
        });

        console.log('Sending workflow:', workflow);

        const response = await fetch(`/api/quotes/${quoteId}/workflow`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ workflow })
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save workflow');
        }

        const result = await response.json();
        console.log('Save result:', result);
        
        // Update local quotes data
        const quoteIndex = this.quotes.findIndex(q => q.id === quoteId);
        if (quoteIndex !== -1) {
            this.quotes[quoteIndex] = result.quote;
            // Update current step to the first non-completed step
            const firstWaitingStep = workflow.find(step => step.status === 'waiting');
            if (firstWaitingStep) {
                this.quotes[quoteIndex].currentStep = firstWaitingStep.id;
            }
        }

        // Show success message first
        this.showNotification('Workflow updated successfully!', 'success');
        
        // Close modal with smooth animation
        this.closeWorkflowModal();
        
        // Refresh the quotes display
        this.filterQuotes();

    } catch (error) {
        console.error('Error saving workflow:', error);
        this.showNotification(error.message || 'Error saving workflow. Please try again.', 'error');
        
        // Reset button state on error
        const saveButton = document.querySelector('.modal-footer .btn-primary');
        if (saveButton) {
            saveButton.innerHTML = 'Save Workflow';
            saveButton.disabled = false;
            }
        }
    }

    closeWorkflowModal() {
        const modal = document.querySelector('.workflow-modal');
        if (!modal) {
            console.log('No modal found to close');
            return;
        }

        console.log('Closing workflow modal...');
        
        // Remove keyboard event listener if it exists
        if (modal.hasAttribute('data-keydown-handler')) {
            document.removeEventListener('keydown', this.handleKeyDown);
        }
        
        // Add closing animation
        modal.style.transition = 'opacity 0.3s ease';
        modal.style.opacity = '0';
        
        // Remove modal after animation
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
                console.log('Modal removed from DOM');
            }
        }, 300);
    }

    setupWorkflowDragAndDrop() {
        console.log('Setting up drag and drop...'); // Debug log
        
        const personaItems = document.querySelectorAll('.persona-item');
        const workflowSteps = document.getElementById('workflowSteps');
        const dropZone = document.getElementById('workflowDropZone');

        console.log('Found elements:', { personaItems: personaItems.length, workflowSteps, dropZone }); // Debug log

        // Make personas draggable
        personaItems.forEach(item => {
            console.log('Setting up persona:', item.dataset.personaId); // Debug log
            
            item.addEventListener('dragstart', (e) => {
                console.log('Drag start:', item.dataset.personaId); // Debug log
                e.dataTransfer.setData('application/json', JSON.stringify({
                    type: 'persona',
                    personaId: item.dataset.personaId
                }));
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', () => {
                console.log('Drag end'); // Debug log
                item.classList.remove('dragging');
            });
        });

        // Setup drop zones for both workflow steps container and drop zone
        [workflowSteps, dropZone].forEach(zone => {
            if (!zone) return;
            
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                zone.classList.add('drag-over');
            });

            zone.addEventListener('dragleave', (e) => {
                if (!zone.contains(e.relatedTarget)) {
                    zone.classList.remove('drag-over');
                }
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                console.log('Drop event triggered'); // Debug log
                zone.classList.remove('drag-over');
                
                try {
                    const data = JSON.parse(e.dataTransfer.getData('application/json'));
                    console.log('Dropped data:', data); // Debug log
                    
                    if (data.type === 'persona') {
                        this.addWorkflowStep(data.personaId);
                    }
                } catch (error) {
                    console.error('Error parsing drop data:', error);
                }
            });
        });

        // Setup sorting for existing workflow steps
        this.setupWorkflowSorting();
    }

    getDefaultAssignee(stepId) {
        const defaultAssignees = {
            'configuration': 'Account Executive',
            'pricing': 'Finance Team',
            'quoting': 'Deal Desk',
            'contract-creation': 'Legal Team',
            'contract-negotiation': 'Chief Revenue Officer',
            'contract-execution': 'Customer',
            'order-fulfillment': 'Operations Team',
            'billing': 'Billing Team',
            'revenue': 'Finance Team',
            'renewal': 'Account Executive'
        };
        
        return defaultAssignees[stepId] || 'Unassigned';
    }

    async addWorkflowStep(personaId) {
    console.log('Adding workflow step:', personaId);
    
    try {
        const personasResponse = await fetch('/api/workflow-personas');
        const personas = await personasResponse.json();
        const persona = personas.find(p => p.id === personaId);

        if (!persona) {
            console.error('Persona not found:', personaId);
            return;
        }

        console.log('Found persona:', persona);

        const workflowSteps = document.getElementById('workflowSteps');
        if (!workflowSteps) {
            console.error('Workflow steps container not found');
            return;
        }

        // Check if this workflow step is already in the workflow
        const existingStep = workflowSteps.querySelector(`[data-step-id="${persona.id}"]`);
        if (existingStep) {
            this.showNotification(`${persona.name} is already in the workflow`, 'error');
            return;
        }

        // Determine default assignee based on workflow step
        const defaultAssignee = this.getDefaultAssignee(persona.id);

        const stepElement = document.createElement('div');
        stepElement.className = 'workflow-step-editor';
        stepElement.draggable = true;
        stepElement.dataset.stepId = persona.id;
        stepElement.innerHTML = `
            <div class="step-handle">
                <i class="fas fa-grip-vertical"></i>
            </div>
            <div class="step-content">
                <div class="step-name">${persona.name}</div>
                <div class="step-assignee">${defaultAssignee}</div>
                <input type="text" class="assignee-input" placeholder="Enter assignee name" style="display: none;">
            </div>
            <div class="step-actions">
                <button class="btn-secondary btn-xs" onclick="quotesApp.editAssignee(this)" title="Edit Assignee">
                    <i class="fas fa-user-edit"></i>
                </button>
                <button class="btn-danger btn-xs" onclick="quotesApp.removeWorkflowStep(this)" title="Remove Step">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        workflowSteps.appendChild(stepElement);
        console.log('Step added to DOM');

        // Add drag events to the new step
        this.setupStepDragEvents(stepElement);

        // Show success feedback with animation
        stepElement.style.opacity = '0';
        stepElement.style.transform = 'translateY(-10px)';
        
        // Force reflow
        stepElement.offsetHeight;
        
        stepElement.style.transition = 'all 0.3s ease';
        stepElement.style.opacity = '1';
        stepElement.style.transform = 'translateY(0)';

        this.showNotification(`${persona.name} added to workflow`, 'success');

    } catch (error) {
        console.error('Error adding workflow step:', error);
        this.showNotification('Error adding workflow step', 'error');
    }
    }

    // Add this new method to provide default assignees for each workflow step
    getDefaultAssignee(stepId) {
        const defaultAssignees = {
            'configuration': 'Account Executive',
            'pricing': 'Finance Team',
            'quoting': 'Deal Desk',
            'contract-creation': 'Legal Team',
            'contract-negotiation': 'Chief Revenue Officer',
            'contract-execution': 'Customer',
            'order-fulfillment': 'Operations Team',
            'billing': 'Billing Team',
            'revenue': 'Finance Team',
            'renewal': 'Account Executive'
        };
        
        return defaultAssignees[stepId] || 'Unassigned';
    }

    setupStepDragEvents(stepElement) {
    console.log('Setting up step drag events for:', stepElement.dataset.stepId); // Debug log
    
    stepElement.addEventListener('dragstart', (e) => {
        console.log('Step drag start:', stepElement.dataset.stepId); // Debug log
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'step',
            stepId: stepElement.dataset.stepId,
            html: stepElement.outerHTML
        }));
        stepElement.classList.add('dragging');
        this.draggedElement = stepElement;
    });

    stepElement.addEventListener('dragend', () => {
        console.log('Step drag end'); // Debug log
        stepElement.classList.remove('dragging');
        this.draggedElement = null;
    });
    }

    setupWorkflowSorting() {
    const workflowSteps = document.getElementById('workflowSteps');
    if (!workflowSteps) return;

    console.log('Setting up workflow sorting'); // Debug log

    // Add drag events to existing steps
    workflowSteps.querySelectorAll('.workflow-step-editor').forEach(step => {
        if (!step.draggable) {
            step.draggable = true;
            this.setupStepDragEvents(step);
        }
    });

    // Remove any existing event listeners to avoid duplicates
    const newWorkflowSteps = workflowSteps.cloneNode(true);
    workflowSteps.parentNode.replaceChild(newWorkflowSteps, workflowSteps);

    // Re-get the element reference
    const updatedWorkflowSteps = document.getElementById('workflowSteps');

    // Re-setup drag events for existing steps
    updatedWorkflowSteps.querySelectorAll('.workflow-step-editor').forEach(step => {
        step.draggable = true;
        this.setupStepDragEvents(step);
    });

    updatedWorkflowSteps.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (this.draggedElement && this.draggedElement.parentNode === updatedWorkflowSteps) {
            const afterElement = this.getDragAfterElement(updatedWorkflowSteps, e.clientY);
            if (afterElement == null) {
                updatedWorkflowSteps.appendChild(this.draggedElement);
            } else {
                updatedWorkflowSteps.insertBefore(this.draggedElement, afterElement);
            }
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

    editAssignee(button) {
        const stepContent = button.closest('.workflow-step-editor').querySelector('.step-content');
        const assigneeDiv = stepContent.querySelector('.step-assignee');
        const assigneeInput = stepContent.querySelector('.assignee-input');
        
        if (assigneeInput.style.display === 'none') {
            // Show input
            assigneeInput.value = assigneeDiv.textContent === 'Unassigned' ? '' : assigneeDiv.textContent;
            assigneeDiv.style.display = 'none';
            assigneeInput.style.display = 'block';
            assigneeInput.focus();
            
            // Handle input events
            const saveAssignee = () => {
                const newAssignee = assigneeInput.value.trim() || 'Unassigned';
                assigneeDiv.textContent = newAssignee;
                assigneeDiv.style.display = 'block';
                assigneeInput.style.display = 'none';
            };
            
            assigneeInput.addEventListener('blur', saveAssignee, { once: true });
            assigneeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveAssignee();
                }
            }, { once: true });
        }
    }

    removeWorkflowStep(button) {
        const stepElement = button.closest('.workflow-step-editor');
        
        // Add animation
        stepElement.style.transition = 'all 0.3s ease';
        stepElement.style.opacity = '0';
        stepElement.style.transform = 'translateX(-100%)';
        
        setTimeout(() => {
            stepElement.remove();
        }, 300);
    }

    async addWorkflowStep(personaId) {
    console.log('Adding workflow step:', personaId);
    
    try {
        const personasResponse = await fetch('/api/workflow-personas');
        const personas = await personasResponse.json();
        const persona = personas.find(p => p.id === personaId);

        if (!persona) {
            console.error('Persona not found:', personaId);
            return;
        }

        console.log('Found persona:', persona);

        const workflowSteps = document.getElementById('workflowSteps');
        if (!workflowSteps) {
            console.error('Workflow steps container not found');
            return;
        }

        // Check if this workflow step is already in the workflow
        const existingStep = workflowSteps.querySelector(`[data-step-id="${persona.id}"]`);
        if (existingStep) {
            this.showNotification(`${persona.name} is already in the workflow`, 'error');
            return;
        }

        // Determine default assignee based on workflow step
        const defaultAssignee = this.getDefaultAssignee(persona.id);

        const stepElement = document.createElement('div');
        stepElement.className = 'workflow-step-editor';
        stepElement.draggable = true;
        stepElement.dataset.stepId = persona.id;
        stepElement.innerHTML = `
            <div class="step-handle">
                <i class="fas fa-grip-vertical"></i>
            </div>
            <div class="step-content">
                <div class="step-name">${persona.name}</div>
                <div class="step-assignee">${defaultAssignee}</div>
                <input type="text" class="assignee-input" placeholder="Enter assignee name" style="display: none;">
            </div>
            <div class="step-actions">
                <button class="btn-secondary btn-xs" onclick="quotesApp.editAssignee(this)" title="Edit Assignee">
                    <i class="fas fa-user-edit"></i>
                </button>
                <button class="btn-danger btn-xs" onclick="quotesApp.removeWorkflowStep(this)" title="Remove Step">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        workflowSteps.appendChild(stepElement);
        console.log('Step added to DOM');

        // Add drag events to the new step
        this.setupStepDragEvents(stepElement);

        // Show success feedback with animation
        stepElement.style.opacity = '0';
        stepElement.style.transform = 'translateY(-10px)';
        
        // Force reflow
        stepElement.offsetHeight;
        
        stepElement.style.transition = 'all 0.3s ease';
        stepElement.style.opacity = '1';
        stepElement.style.transform = 'translateY(0)';

        this.showNotification(`${persona.name} added to workflow`, 'success');

    } catch (error) {
        console.error('Error adding workflow step:', error);
        this.showNotification('Error adding workflow step', 'error');
    }
    }

    // Add this new method to provide default assignees for each workflow step
    getDefaultAssignee(stepId) {
        const defaultAssignees = {
            'configuration': 'Account Executive',
            'pricing': 'Finance Team',
            'quoting': 'Deal Desk',
            'contract-creation': 'Legal Team',
            'contract-negotiation': 'Chief Revenue Officer',
            'contract-execution': 'Customer',
            'order-fulfillment': 'Operations Team',
            'billing': 'Billing Team',
            'revenue': 'Finance Team',
            'renewal': 'Account Executive'
        };
        
        return defaultAssignees[stepId] || 'Unassigned';
    }

    viewQuote(quoteId) {
        console.log('Viewing quote:', quoteId);
        alert(`Detailed quote view for ${quoteId} would open here.`);
    }

    createNewQuote() {
        console.log('Creating new quote');
        window.location.href = '/quotes/create';
    }

    showUserMenu() {
        // Simple logout for now
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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.quotesApp = new QuotesApp();
});
