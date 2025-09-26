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
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
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
        res.redirect(process.env.SUCCESS_REDIRECT || '/dashboard');
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

// Add this before the app.listen() call

// Protected insights route
app.get('/insights', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'insights.html'));
});

// API endpoint to get insights data
app.get('/api/insights', isAuthenticated, (req, res) => {
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
app.get('/api/insights/filter', isAuthenticated, (req, res) => {
    const { dateRange, salesRep, status } = req.query;
    
    // Mock filtered data based on query parameters
    let filteredData = {
        message: `Filtered insights for: ${dateRange || 'all time'}`,
        filters: {
            dateRange: dateRange || 'all',
            salesRep: salesRep || 'all',
            status: status || 'all'
        },
        // You would implement actual filtering logic here
        totalQuotes: dateRange === 'last30days' ? 23 : 156,
        totalRevenue: dateRange === 'last30days' ? 385000 : 2450000
    };
    
    res.json(filteredData);
});

// Available workflow personas
// Replace the existing workflowPersonas array with this updated one
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
app.get('/api/quotes', isAuthenticated, (req, res) => {
    res.json(mockQuotes);
});

// API endpoint to get workflow personas
app.get('/api/workflow-personas', isAuthenticated, (req, res) => {
    res.json(workflowPersonas);
});

// API endpoint to update quote workflow
app.put('/api/quotes/:id/workflow', isAuthenticated, (req, res) => {
    const quoteId = req.params.id;
    const { workflow } = req.body;
    
    console.log('Updating workflow for quote:', quoteId); // Debug log
    console.log('New workflow:', workflow); // Debug log
    
    const quoteIndex = mockQuotes.findIndex(q => q.id === quoteId);
    if (quoteIndex === -1) {
        console.error('Quote not found:', quoteId); // Debug log
        return res.status(404).json({ error: 'Quote not found' });
    }
    
    // Update the workflow
    mockQuotes[quoteIndex].workflow = workflow;
    
    // Update the current step to the first non-completed step
    const firstWaitingStep = workflow.find(step => step.status === 'waiting');
    if (firstWaitingStep) {
        mockQuotes[quoteIndex].currentStep = firstWaitingStep.id;
    }
    
    console.log('Updated quote:', mockQuotes[quoteIndex]); // Debug log
    
    res.json({ success: true, quote: mockQuotes[quoteIndex] });
});

// API endpoints for tab content
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
            title: 'Quotes',
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
            isQuotesRedirect: true // Handle redirect
        },
        createQuotes: {
            image: '✨',
            title: 'Create New Quotes',
            subtitle: 'Get started with quote creation',
            content: 'Build professional quotes quickly with our intuitive quote builder and configuration tools.',
            features: [
                { icon: 'fas fa-magic', text: 'Drag & Drop Builder' },
                { icon: 'fas fa-palette', text: 'Custom Branding' },
                { icon: 'fas fa-download', text: 'PDF Export' }
            ],
            stats: {
                templates: '50+',
                time: '5 min',
                automation: '80%'
            }
        },
        insights: {
            image: '📊',
            title: 'Analytics & Insights',
            subtitle: 'Smart business intelligence',
            content: 'Get detailed insights into your sales performance with our advanced analytics dashboard.',
            features: [
                { icon: 'fas fa-chart-bar', text: 'Real-time Analytics' },
                { icon: 'fas fa-brain', text: 'AI Predictions' },
                { icon: 'fas fa-bell', text: 'Smart Alerts' }
            ],
            stats: {
                dataPoints: '1M+',
                accuracy: '95%',
                reports: '100+'
            }
        },
        support: {
            image: '🎧',
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

// Add this route to your server.js
app.get('/quotes', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'quotes.html'));
});

// In your Express.js backend
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction error:', err);
        }
        res.clearCookie('connect.sid'); // Clear session cookie
        res.json({ success: true, message: 'Logged out successfully' });
    });
});


app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔐 Google OAuth configured: ${!!process.env.GOOGLE_CLIENT_ID}`);
});