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

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔐 Google OAuth configured: ${!!process.env.GOOGLE_CLIENT_ID}`);
});

// Mock data for quotes
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
        currentStep: 'deal-desk',
        workflow: [
            { id: 'ae', name: 'Account Executive', status: 'completed', assignee: 'John Smith', completedDate: '2025-01-15' },
            { id: 'deal-desk', name: 'Deal Desk', status: 'pending', assignee: 'Sarah Johnson', completedDate: null },
            { id: 'customer', name: 'Customer', status: 'waiting', assignee: 'Acme Corporation', completedDate: null }
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
        currentStep: 'cro',
        workflow: [
            { id: 'ae', name: 'Account Executive', status: 'completed', assignee: 'Mike Davis', completedDate: '2025-01-14' },
            { id: 'deal-desk', name: 'Deal Desk', status: 'completed', assignee: 'Sarah Johnson', completedDate: '2025-01-15' },
            { id: 'cro', name: 'Chief Revenue Officer', status: 'pending', assignee: 'Robert Chen', completedDate: null },
            { id: 'legal', name: 'Legal', status: 'waiting', assignee: 'Legal Team', completedDate: null },
            { id: 'customer', name: 'Customer', status: 'waiting', assignee: 'TechStart Inc.', completedDate: null }
        ]
    },
    {
        id: 'Q-2025-003',
        customer: 'Global Solutions Ltd.',
        amount: 250000,
        discount: 45,
        status: 'pending',
        createdBy: 'Lisa Wang (AE)',
        createdDate: '2025-01-13',
        products: ['Enterprise License', 'Premium Support', 'Custom Integration'],
        currentStep: 'finance',
        workflow: [
            { id: 'ae', name: 'Account Executive', status: 'completed', assignee: 'Lisa Wang', completedDate: '2025-01-13' },
            { id: 'deal-desk', name: 'Deal Desk', status: 'completed', assignee: 'Sarah Johnson', completedDate: '2025-01-13' },
            { id: 'cro', name: 'Chief Revenue Officer', status: 'completed', assignee: 'Robert Chen', completedDate: '2025-01-14' },
            { id: 'legal', name: 'Legal', status: 'completed', assignee: 'Legal Team', completedDate: '2025-01-14' },
            { id: 'finance', name: 'Finance', status: 'pending', assignee: 'Finance Team', completedDate: null },
            { id: 'customer', name: 'Customer', status: 'waiting', assignee: 'Global Solutions Ltd.', completedDate: null }
        ]
    }
];

// Available workflow personas
const workflowPersonas = [
    {
        id: 'ae',
        name: 'Account Executive',
        description: 'Creates the quote',
        icon: 'fas fa-user-tie',
        color: '#3b82f6'
    },
    {
        id: 'deal-desk',
        name: 'Deal Desk',
        description: 'Approves quotes with modest discounts (up to 15%)',
        icon: 'fas fa-handshake',
        color: '#10b981'
    },
    {
        id: 'cro',
        name: 'Chief Revenue Officer',
        description: 'Approves quotes with larger discounts (15–40%)',
        icon: 'fas fa-crown',
        color: '#f59e0b'
    },
    {
        id: 'legal',
        name: 'Legal',
        description: 'Reviews quotes for contractual language',
        icon: 'fas fa-gavel',
        color: '#8b5cf6'
    },
    {
        id: 'finance',
        name: 'Finance',
        description: 'Approves edge-case deals (discounts >40% or bespoke payment terms)',
        icon: 'fas fa-calculator',
        color: '#ef4444'
    },
    {
        id: 'customer',
        name: 'Customer',
        description: 'Receives the final approved quote',
        icon: 'fas fa-building',
        color: '#6b7280'
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
    
    const quoteIndex = mockQuotes.findIndex(q => q.id === quoteId);
    if (quoteIndex === -1) {
        return res.status(404).json({ error: 'Quote not found' });
    }
    
    mockQuotes[quoteIndex].workflow = workflow;
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
