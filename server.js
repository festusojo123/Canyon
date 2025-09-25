const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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

// API endpoints for tab content
app.get('/api/content/:tab', (req, res) => {
    const tabContent = {
        home: {
            image: '🏠',  // Changed from 'icon' to 'image'
            title: 'Platform Overview',
            subtitle: 'Everything you need in one place',
            content: 'Our comprehensive platform brings together powerful tools, intuitive design, and seamless integrations.',  // Changed from 'text' to 'content'
            features: [  // Added features array
                { icon: 'fas fa-rocket', text: 'Lightning Fast Performance' },
                { icon: 'fas fa-shield-alt', text: 'Enterprise Security' },
                { icon: 'fas fa-users', text: 'Team Collaboration' }
            ],
            stats: {  // Added stats object
                users: '50K+',
                uptime: '99.9%',
                countries: '120+'
            }
        },
        quotes: {
            image: '📋',
            title: 'Quote Management',
            subtitle: 'Advanced quote capabilities',
            content: 'Create, manage, and track quotes with our powerful quote management system.',
            features: [
                { icon: 'fas fa-file-invoice', text: 'Professional Templates' },
                { icon: 'fas fa-calculator', text: 'Smart Pricing Engine' },
                { icon: 'fas fa-clock', text: 'Quick Generation' }
            ],
            stats: {
                quotes: '10K+',
                accuracy: '99.5%',
                savings: '40%'
            }
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

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔐 Google OAuth configured: ${!!process.env.GOOGLE_CLIENT_ID}`);
});
