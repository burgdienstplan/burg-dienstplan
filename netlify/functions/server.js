const express = require('express');
const serverless = require('serverless-http');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');
const User = require('../../models/User');

const app = express();

// MongoDB Verbindung
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB verbunden');
}).catch(err => {
    console.error('MongoDB Verbindungsfehler:', err);
});

// Session-Konfiguration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 // 24 Stunden
    }
}));

// EJS als Template Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../../views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../../public')));

// Auth-Middleware
const { requireAuth, requireRole } = require('../../middleware/auth');

// Login-Route
app.get('/', (req, res) => {
    res.render('login', { error: req.query.error });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Admin-Login für Tests
        if (username === 'admin' && password === 'Ratzendorf55') {
            req.session.userId = 'admin';
            req.session.role = 'kastellan';
            req.session.username = 'admin';
            return res.redirect('/kastellan/dashboard');
        }

        // Normaler Login
        const user = await User.findOne({ username });
        if (!user || !(await user.comparePassword(password))) {
            return res.redirect('/?error=Ungültige Anmeldedaten');
        }

        req.session.userId = user._id;
        req.session.role = user.role;
        req.session.username = user.username;

        switch (user.role) {
            case 'kastellan':
                res.redirect('/kastellan/dashboard');
                break;
            case 'hausmeister':
                res.redirect('/hausmeister/dashboard');
                break;
            case 'shop':
                res.redirect('/shop/dashboard');
                break;
            default:
                res.redirect('/');
        }
    } catch (error) {
        console.error('Login-Fehler:', error);
        res.redirect('/?error=Ein Fehler ist aufgetreten');
    }
});

// Dashboard-Routen
app.get('/kastellan/dashboard', requireAuth, requireRole('kastellan'), (req, res) => {
    res.render('kastellan/dashboard', {
        user: {
            username: req.session.username,
            role: req.session.role
        }
    });
});

app.get('/hausmeister/dashboard', requireAuth, requireRole('hausmeister'), (req, res) => {
    res.render('hausmeister/dashboard', {
        user: {
            username: req.session.username,
            role: req.session.role
        }
    });
});

app.get('/shop/dashboard', requireAuth, requireRole('shop'), (req, res) => {
    res.render('shop/dashboard', {
        user: {
            username: req.session.username,
            role: req.session.role
        }
    });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// Export für Netlify Functions
const handler = serverless(app);
module.exports.handler = async (event, context) => {
    return await handler(event, context);
};
