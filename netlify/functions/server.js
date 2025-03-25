const express = require('express');
const serverless = require('serverless-http');
const session = require('express-session');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Steindorfer:Ratzendorf55@cluster0.ay1oe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
let db;

async function connectDB() {
  try {
    const client = await MongoClient.connect(MONGODB_URI);
    db = client.db('burgdienstplan');
    console.log('Connected to MongoDB');
    
    // Erstelle Admin-Benutzer, wenn noch keiner existiert
    const adminExists = await db.collection('users').findOne({ username: 'admin' });
    if (!adminExists) {
      await db.collection('users').insertOne({
        username: 'admin',
        password: 'admin2025', // Später durch gehashtes Passwort ersetzen
        role: 'kastellan',
        name: 'Administrator',
        email: 'admin@burghochosterwitz.com'
      });
      console.log('Admin-Benutzer erstellt');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration
app.use(session({
  secret: 'burgHochosterwitz2025',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Base path middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/.netlify/functions/server')) {
    req.url = req.url.replace('/.netlify/functions/server', '');
  }
  next();
});

// Debug Middleware
app.use((req, res, next) => {
  console.log('Request URL:', req.url);
  console.log('Views Directory:', app.get('views'));
  console.log('Session:', req.session);
  next();
});

// Routes
app.get('/', (req, res) => {
  console.log('Rendering login page');
  res.render('login', { error: null });
});

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', username);
  
  try {
    // Case-insensitive Suche für den Benutzernamen
    const user = await db.collection('users').findOne({
      username: { $regex: new RegExp('^' + username + '$', 'i') }
    });
    
    console.log('Found user:', user ? 'yes' : 'no');
    
    if (user && password === user.password) {
      req.session.user = {
        id: user._id,
        username: user.username,
        role: user.role
      };
      
      console.log('Login successful, role:', user.role);
      
      switch (user.role) {
        case 'kastellan':
          return res.redirect('/kastellan/dashboard');
        case 'hausmeister':
          return res.redirect('/hausmeister/dashboard');
        case 'mitarbeiter':
          return res.redirect('/mitarbeiter/dashboard');
        default:
          return res.redirect('/');
      }
    } else {
      console.log('Login failed');
      return res.render('login', { error: 'Ungültige Anmeldedaten' });
    }
  } catch (err) {
    console.error('Login error:', err);
    return res.render('login', { error: 'Ein Fehler ist aufgetreten' });
  }
});

// Protected route middleware
const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  next();
};

// Dashboard routes
app.get('/kastellan/dashboard', requireLogin, (req, res) => {
  console.log('Accessing kastellan dashboard');
  if (req.session.user.role !== 'kastellan') {
    return res.redirect('/');
  }
  
  try {
    return res.render('kastellan/dashboard', {
      user: req.session.user,
      error: null
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.render('error', { error: 'Fehler beim Laden des Dashboards' });
  }
});

app.get('/hausmeister/dashboard', requireLogin, (req, res) => {
  if (req.session.user.role !== 'hausmeister') {
    return res.redirect('/');
  }
  
  try {
    return res.render('hausmeister/dashboard', {
      user: req.session.user,
      error: null
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.render('error', { error: 'Fehler beim Laden des Dashboards' });
  }
});

app.get('/mitarbeiter/dashboard', requireLogin, (req, res) => {
  if (req.session.user.role !== 'mitarbeiter') {
    return res.redirect('/');
  }
  
  try {
    return res.render('mitarbeiter/dashboard', {
      user: req.session.user,
      error: null
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.render('error', { error: 'Fehler beim Laden des Dashboards' });
  }
});

// Logout route
app.get('/auth/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  return res.status(500).render('error', { error: 'Ein Fehler ist aufgetreten' });
});

// Handler für Netlify Functions
const handler = serverless(app);

exports.handler = async (event, context) => {
  return await handler(event, context);
};
