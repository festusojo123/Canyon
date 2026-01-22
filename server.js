const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key', // Fixed: added fallback
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const user = {
            id: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            picture: profile.photos[0].value,
            accessToken: accessToken,
            provider: 'google'
        };
        
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user, done) => {
    done(null, user);
});

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/?error=unauthorized');
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Google OAuth routes
app.get('/auth/google',
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })
);

app.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: process.env.FAILURE_REDIRECT || '/?error=auth_failed'
    }),
    (req, res) => {
        console.log('✅ OAuth authentication successful');
        console.log('User:', req.user && req.user.email ? req.user.email : 'Unknown user');

        // Save session before redirecting to avoid race condition
        req.session.save((err) => {
            if (err) {
                console.error('❌ Session save error:', err);
                return res.redirect('/?error=session_error');
            }
            console.log('💾 Session saved successfully');
            res.redirect(process.env.SUCCESS_REDIRECT || '/dashboard');
        });
    }
);

// Logout route
app.post('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: 'Session destruction failed' });
            }
            res.clearCookie('connect.sid');
            res.json({ success: true, message: 'Logged out successfully' });
        });
    });
});

// Protected dashboard route
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// API to get current user
app.get('/api/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            authenticated: true,
            user: {
                id: req.user.id,
                email: req.user.email,
                name: req.user.name,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                picture: req.user.picture
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Protected insights route
app.get('/insights', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'insights.html'));
});

app.get('/support', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'support.html'));
});

// Protected quotes routes
app.get('/quotes', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'quotes.html'));
});

app.get('/quotes/create', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'create-quote.html'));
});

// API endpoint to get insights data
app.get('/api/insights', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    // Mock insights data - replace with actual database queries
    const insightsData = {
        overview: {
            totalQuotes: 156,
            totalRevenue: 2450000,
            conversionRate: 68.5,
            averageDealSize: 85000,
            monthlyGrowth: 12.3
        },
        salesMetrics: {
            quotesThisMonth: 23,
            quotesLastMonth: 19,
            revenueThisMonth: 385000,
            revenueLastMonth: 342000,
            topPerformer: 'Lisa Wang',
            averageCloseTime: 14 // days
        },
        workflowAnalytics: {
            bottlenecks: [
                { step: 'contract-negotiation', averageTime: 5.2, count: 8 },
                { step: 'pricing', averageTime: 2.1, count: 12 },
                { step: 'contract-execution', averageTime: 7.8, count: 5 }
            ],
            completionRates: {
                configuration: 98.5,
                pricing: 92.1,
                quoting: 89.7,
                'contract-creation': 85.3,
                'contract-negotiation': 78.9,
                'contract-execution': 72.4,
                'order-fulfillment': 95.8,
                billing: 91.2,
                revenue: 88.6,
                renewal: 67.3
            }
        },
        recentActivity: [
            {
                id: 1,
                type: 'quote_approved',
                description: 'Quote Q-2025-003 approved for $250,000',
                timestamp: '2025-01-17T10:30:00Z',
                user: 'Robert Chen'
            },
            {
                id: 2,
                type: 'workflow_completed',
                description: 'Contract execution completed for TechStart Inc.',
                timestamp: '2025-01-17T09:15:00Z',
                user: 'System'
            },
            {
                id: 3,
                type: 'quote_created',
                description: 'New quote Q-2025-004 created for Innovation Corp',
                timestamp: '2025-01-17T08:45:00Z',
                user: 'John Smith'
            }
        ],
        chartData: {
            monthlyRevenue: [
                { month: 'Jul', revenue: 180000 },
                { month: 'Aug', revenue: 220000 },
                { month: 'Sep', revenue: 195000 },
                { month: 'Oct', revenue: 285000 },
                { month: 'Nov', revenue: 310000 },
                { month: 'Dec', revenue: 342000 },
                { month: 'Jan', revenue: 385000 }
            ],
            quotesStatus: [
                { status: 'pending', count: 45 },
                { status: 'approved', count: 78 },
                { status: 'rejected', count: 12 },
                { status: 'expired', count: 21 }
            ],
            workflowDistribution: [
                { step: 'configuration', count: 15 },
                { step: 'pricing', count: 12 },
                { step: 'quoting', count: 8 },
                { step: 'contract-negotiation', count: 6 },
                { step: 'billing', count: 4 }
            ]
        }
    };
    
    res.json(insightsData);
});

// API endpoint to get filtered insights data
app.get('/api/insights/filter', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const { dateRange, salesRep, status } = req.query;
    
    // Mock filtered data based on query parameters
    let filteredData = {
        message: `Filtered insights for: ${dateRange || 'all time'}`, // Fixed: added fallback
        filters: {
            dateRange: dateRange || 'all', // Fixed: added fallback
            salesRep: salesRep || 'all', // Fixed: added fallback
            status: status || 'all' // Fixed: added fallback
        },
        // You would implement actual filtering logic here
        totalQuotes: dateRange === 'last30days' ? 23 : 156,
        totalRevenue: dateRange === 'last30days' ? 385000 : 2450000
    };
    
    res.json(filteredData);
});

// Available workflow personas
const workflowPersonas = [
    {
        id: 'configuration',
        name: 'Configuration',
        description: 'Configure product settings and requirements',
        icon: 'fas fa-cog',
        color: '#3b82f6'
    },
    {
        id: 'pricing',
        name: 'Pricing',
        description: 'Set pricing and discount structures',
        icon: 'fas fa-tag',
        color: '#10b981'
    },
    {
        id: 'quoting',
        name: 'Quoting',
        description: 'Generate and format the quote',
        icon: 'fas fa-file-invoice',
        color: '#f59e0b'
    },
    {
        id: 'contract-creation',
        name: 'Contract Creation',
        description: 'Create contract documents',
        icon: 'fas fa-file-contract',
        color: '#8b5cf6'
    },
    {
        id: 'contract-negotiation',
        name: 'Contract Negotiation',
        description: 'Negotiate contract terms',
        icon: 'fas fa-handshake',
        color: '#ef4444'
    },
    {
        id: 'contract-execution',
        name: 'Contract Execution',
        description: 'Execute and sign contracts',
        icon: 'fas fa-pen-fancy',
        color: '#06b6d4'
    },
    {
        id: 'order-fulfillment',
        name: 'Order Fulfillment',
        description: 'Process and fulfill orders',
        icon: 'fas fa-truck',
        color: '#84cc16'
    },
    {
        id: 'billing',
        name: 'Billing',
        description: 'Generate invoices and process payments',
        icon: 'fas fa-receipt',
        color: '#f97316'
    },
    {
        id: 'revenue',
        name: 'Revenue',
        description: 'Track and recognize revenue',
        icon: 'fas fa-chart-line',
        color: '#ec4899'
    },
    {
        id: 'renewal',
        name: 'Renewal',
        description: 'Manage contract renewals',
        icon: 'fas fa-redo',
        color: '#6366f1'
    }
];

const mockQuotes = [
    {
        id: 'Q-2025-001',
        customer: 'Acme Corporation',
        amount: 125000,
        discount: 12,
        status: 'pending',
        createdBy: 'John Smith (AE)',
        createdDate: '2025-01-15',
        products: ['Enterprise License', 'Premium Support'],
        currentStep: 'pricing',
        workflow: [
            { id: 'configuration', name: 'Configuration', status: 'completed', assignee: 'John Smith (AE)', completedDate: '2025-01-15' },
            { id: 'pricing', name: 'Pricing', status: 'pending', assignee: 'Sarah Johnson (Finance)', completedDate: null },
            { id: 'quoting', name: 'Quoting', status: 'waiting', assignee: 'Deal Desk', completedDate: null }
        ]
    },
    {
        id: 'Q-2025-002',
        customer: 'TechStart Inc.',
        amount: 75000,
        discount: 25,
        status: 'pending',
        createdBy: 'Mike Davis (AE)',
        createdDate: '2025-01-14',
        products: ['Standard License', 'Basic Support'],
        currentStep: 'contract-negotiation',
        workflow: [
            { id: 'configuration', name: 'Configuration', status: 'completed', assignee: 'Mike Davis (AE)', completedDate: '2025-01-14' },
            { id: 'pricing', name: 'Pricing', status: 'completed', assignee: 'Finance Team', completedDate: '2025-01-15' },
            { id: 'quoting', name: 'Quoting', status: 'completed', assignee: 'Deal Desk', completedDate: '2025-01-15' },
            { id: 'contract-creation', name: 'Contract Creation', status: 'completed', assignee: 'Legal Team', completedDate: '2025-01-16' },
            { id: 'contract-negotiation', name: 'Contract Negotiation', status: 'pending', assignee: 'Robert Chen (CRO)', completedDate: null },
            { id: 'contract-execution', name: 'Contract Execution', status: 'waiting', assignee: 'Customer', completedDate: null }
        ]
    },
    {
        id: 'Q-2025-003',
        customer: 'Global Solutions Ltd.',
        amount: 250000,
        discount: 45,
        status: 'approved',
        createdBy: 'Lisa Wang (AE)',
        createdDate: '2025-01-13',
        products: ['Enterprise License', 'Premium Support', 'Custom Integration'],
        currentStep: 'billing',
        workflow: [
            { id: 'configuration', name: 'Configuration', status: 'completed', assignee: 'Lisa Wang (AE)', completedDate: '2025-01-13' },
            { id: 'pricing', name: 'Pricing', status: 'completed', assignee: 'Finance Team', completedDate: '2025-01-13' },
            { id: 'quoting', name: 'Quoting', status: 'completed', assignee: 'Deal Desk', completedDate: '2025-01-14' },
            { id: 'contract-creation', name: 'Contract Creation', status: 'completed', assignee: 'Legal Team', completedDate: '2025-01-14' },
            { id: 'contract-negotiation', name: 'Contract Negotiation', status: 'completed', assignee: 'Robert Chen (CRO)', completedDate: '2025-01-15' },
            { id: 'contract-execution', name: 'Contract Execution', status: 'completed', assignee: 'Customer', completedDate: '2025-01-16' },
            { id: 'order-fulfillment', name: 'Order Fulfillment', status: 'completed', assignee: 'Operations Team', completedDate: '2025-01-17' },
            { id: 'billing', name: 'Billing', status: 'pending', assignee: 'Billing Team', completedDate: null },
            { id: 'revenue', name: 'Revenue', status: 'waiting', assignee: 'Finance Team', completedDate: null },
            { id: 'renewal', name: 'Renewal', status: 'waiting', assignee: 'Account Executive', completedDate: null }
        ]
    }
];

// API endpoint to get quotes
app.get('/api/quotes', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    res.json(mockQuotes);
});

// API endpoint to get workflow personas
app.get('/api/workflow-personas', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    res.json(workflowPersonas);
});

// API endpoint to update quote workflow
app.put('/api/quotes/:id/workflow', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const quoteId = req.params.id;
    const { workflow } = req.body;
    
    console.log('Updating workflow for quote:', quoteId);
    console.log('New workflow:', workflow);
    
    const quoteIndex = mockQuotes.findIndex(q => q.id === quoteId);
    if (quoteIndex === -1) {
        console.error('Quote not found:', quoteId);
        return res.status(404).json({ error: 'Quote not found' });
    }
    
    // Update the workflow
    mockQuotes[quoteIndex].workflow = workflow;
    
    // Update the current step to the first non-completed step
    const firstWaitingStep = workflow.find(step => step.status === 'waiting');
    if (firstWaitingStep) {
        mockQuotes[quoteIndex].currentStep = firstWaitingStep.id;
    }
    
    console.log('Updated quote:', mockQuotes[quoteIndex]);
    
    res.json({ success: true, quote: mockQuotes[quoteIndex] });
});

// API endpoints for tab content with enhanced redirect buttons
app.get('/api/content/:tab', (req, res) => {
    const tabContent = {
        home: {
            image: '🏠',
            title: 'Overview',
            subtitle: 'Everything you need in one place',
            content: 'Our comprehensive platform brings together powerful tools, intuitive design, and seamless integrations.',
            features: [
                { icon: 'fas fa-rocket', text: 'Lightning Fast Performance' },
                { icon: 'fas fa-shield-alt', text: 'Enterprise Security' },
                { icon: 'fas fa-users', text: 'Team Collaboration' }
            ],
            stats: {
                users: '50K+',
                uptime: '99.9%',
                countries: '120+'
            }
        },
        quotes: {
            image: '📋',
            title: 'Quotes Management',
            subtitle: 'Advanced quote capabilities with approval workflows',
            content: 'Create, manage, and track quotes with our powerful quote management system featuring customizable approval workflows.',
            features: [
                { icon: 'fas fa-route', text: 'Custom Approval Workflows' },
                { icon: 'fas fa-arrows-alt', text: 'Drag & Drop Builder' },
                { icon: 'fas fa-users-cog', text: 'Role-Based Approvals' },
                { icon: 'fas fa-clock', text: 'Real-time Tracking' }
            ],
            stats: {
                quotes: '10K+',
                accuracy: '99.5%',
                savings: '40%'
            },
            isQuotesRedirect: true,
            redirectConfig: {
                title: 'Access Full Quotes System',
                description: 'Manage all your quotes with advanced workflow capabilities',
                buttonText: 'Go to Quotes Dashboard',
                buttonIcon: 'fas fa-tachometer-alt',
                url: '/quotes',
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                shadowColor: 'rgba(102, 126, 234, 0.4)'
            }
        },
        createQuotes: {
            image: '✨',
            title: 'Create New Quotes',
            subtitle: 'AI-powered quote generation',
            content: 'Build professional quotes quickly with our intuitive quote builder, AI assistance, and smart configuration tools.',
            features: [
                { icon: 'fas fa-robot', text: 'AI Quote Generation' },
                { icon: 'fas fa-magic', text: 'Smart Templates' },
                { icon: 'fas fa-palette', text: 'Custom Branding' },
                { icon: 'fas fa-download', text: 'Instant PDF Export' }
            ],
            stats: {
                templates: '50+',
                time: '3 min',
                automation: '85%'
            },
            isCreateQuotesRedirect: true,
            redirectConfig: {
                title: 'Start Creating Quotes',
                description: 'Launch the AI-powered quote builder and create professional quotes in minutes',
                buttonText: 'Create New Quote',
                buttonIcon: 'fas fa-plus-circle',
                url: '/quotes/create',
                gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                shadowColor: 'rgba(17, 153, 142, 0.4)'
            }
        },
        insights: {
            image: '📊',
            title: 'Analytics & Insights',
            subtitle: 'AI-driven business intelligence',
            content: 'Get detailed insights into your sales performance with our advanced analytics dashboard powered by machine learning.',
            features: [
                { icon: 'fas fa-chart-line', text: 'Real-time Analytics' },
                { icon: 'fas fa-brain', text: 'AI Predictions' },
                { icon: 'fas fa-bell', text: 'Smart Alerts' },
                { icon: 'fas fa-filter', text: 'Advanced Filtering' }
            ],
            stats: {
                dataPoints: '1M+',
                accuracy: '97%',
                reports: '150+'
            },
            isInsightsRedirect: true,
            redirectConfig: {
                title: 'Explore Analytics Dashboard',
                description: 'Dive deep into your sales data with comprehensive analytics and AI insights',
                buttonText: 'View Analytics',
                buttonIcon: 'fas fa-chart-bar',
                url: '/insights',
                gradient: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
                shadowColor: 'rgba(255, 107, 107, 0.4)'
            }
        },
        support: {
            image: "🛟",
            title: '24/7 Support',
            subtitle: 'We\'re here to help',
            content: 'Get assistance whenever you need it with our dedicated support team available around the clock.',
            features: [
                { icon: 'fas fa-comments', text: 'Live Chat Support' },
                { icon: 'fas fa-book', text: 'Knowledge Base' },
                { icon: 'fas fa-video', text: 'Video Tutorials' }
            ],
            stats: {
                response: '< 1min',
                satisfaction: '98%',
                articles: '500+'
            },
            isSupportRedirect: true,
            redirectConfig: {
                title: 'Access Support Center',
                description: 'Get personalized help with your team\'s needs from our support staff or AI-powered assistant.',
                buttonText: 'Get Support',
                buttonIcon: 'fas fa-life-ring',  // Changed from chart-bar to life-ring
                url: '/support',  // Changed from /insights to /support
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',  // Changed to purple gradient
                shadowColor: 'rgba(102, 126, 234, 0.4)'  // Changed shadow color to match gradient
            }
        }
    };

    const tab = req.params.tab;
    res.json(tabContent[tab] || { 
        title: "Not Found", 
        subtitle: "Content not available",
        content: "The requested content could not be found.",
        features: [],
        image: "❌",
        stats: {}
    });
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction error:', err);
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// AI quote generation endpoint
app.post('/api/quotes/generate-ai', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const { prompt, customerContext } = req.body;
    
    setTimeout(() => {
        const mockAIQuote = generateMockAIQuote(prompt, customerContext);
        res.json({
            success: true,
            quote: mockAIQuote,
            confidence: 0.92,
            suggestions: [
                "Consider adding Premium Support for enterprise customers",
                "Volume discount available for orders over 50 seats",
                "Custom integration services recommended for this customer size"
            ]
        });
    }, 2000);
});

// Mock AI quote generation function
function generateMockAIQuote(prompt, customerContext) {
    const lowerPrompt = prompt.toLowerCase();
    
    const quantityMatch = lowerPrompt.match(/(\d+)\s*(seats?|licenses?|users?)/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
    
    const discountMatch = lowerPrompt.match(/(\d+)%?\s*discount/);
    const discount = discountMatch ? parseInt(discountMatch[1]) : 0;
    
    let selectedProducts = [];
    
    if (lowerPrompt.includes('enterprise') || quantity > 50) {
        selectedProducts.push({
            id: 'ENT-LIC-001',
            name: 'Enterprise License',
            category: 'Software License',
            basePrice: 50000,
            quantity: Math.max(1, Math.floor(quantity / 100)),
            discount: discount,
            aiReasoning: 'Selected Enterprise License based on high seat count and enterprise keywords'
        });
        
        if (lowerPrompt.includes('support') || quantity > 100) {
            selectedProducts.push({
                id: 'PREM-SUP-001',
                name: 'Premium Support',
                category: 'Support Services',
                basePrice: 15000,
                quantity: 1,
                discount: Math.max(0, discount - 5),
                aiReasoning: 'Added Premium Support for enterprise deployment'
            });
        }
    } else if (lowerPrompt.includes('standard') || quantity <= 50) {
        selectedProducts.push({
            id: 'STD-LIC-001',
            name: 'Standard License',
            category: 'Software License',
            basePrice: 25000,
            quantity: Math.max(1, Math.floor(quantity / 50)),
            discount: discount,
            aiReasoning: 'Selected Standard License for smaller deployment'
        });
        
        selectedProducts.push({
            id: 'BAS-SUP-001',
            name: 'Basic Support',
            category: 'Support Services',
            basePrice: 5000,
            quantity: 1,
            discount: Math.max(0, discount - 10),
            aiReasoning: 'Added Basic Support as standard offering'
        });
    }
    
    if (quantity > 200 || lowerPrompt.includes('integration') || lowerPrompt.includes('custom')) {
        selectedProducts.push({
            id: 'CUS-INT-001',
            name: 'Custom Integration',
            category: 'Professional Services',
            basePrice: 35000,
            quantity: 1,
            discount: Math.max(0, discount - 15),
            aiReasoning: 'Added Custom Integration for complex deployment requirements'
        });
    }
    
    let subtotal = 0;
    let totalDiscount = 0;
    
    selectedProducts.forEach(product => {
        const lineSubtotal = product.basePrice * product.quantity;
        const discountAmount = lineSubtotal * (product.discount / 100);
        subtotal += lineSubtotal;
        totalDiscount += discountAmount;
    });
    
    return {
        products: selectedProducts,
        summary: {
            subtotal: subtotal,
            totalDiscount: totalDiscount,
            total: subtotal - totalDiscount,
            seatCount: quantity,
            averageDiscountPercent: Math.round((totalDiscount / subtotal) * 100)
        },
        aiInsights: {
            confidence: 0.92,
            reasoning: `Based on your request for ${quantity} seats with ${discount}% discount, I've configured an appropriate solution. The total includes volume discounts and recommended add-ons for this deployment size.`,
            riskFactors: discount > 30 ? ['High discount may require additional approval'] : [],
            opportunities: [
                'Multi-year contract could provide additional savings',
                'Training services available for large deployments'
            ]
        }
    };
}

app.listen(PORT, () => {
    console.log(`🚀 Server running on https://canyon-cpq-29148578099.us-west1.run.app`);
    console.log(`🔐 Google OAuth configured: ${!!process.env.GOOGLE_CLIENT_ID}`);
});
