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
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration
app.use(session({
  secret: 'burgHochosterwitz2025',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Routes
app.get('/', (req, res) => {
  res.render('login');
});

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await db.collection('users').findOne({ username });
    
    if (user && password === user.password) { // We'll add proper password hashing later
      req.session.user = {
        id: user._id,
        username: user.username,
        role: user.role
      };
      
      switch (user.role) {
        case 'kastellan':
          res.redirect('/kastellan/dashboard');
          break;
        case 'hausmeister':
          res.redirect('/hausmeister/dashboard');
          break;
        case 'mitarbeiter':
          res.redirect('/mitarbeiter/dashboard');
          break;
        default:
          res.redirect('/');
      }
    } else {
      res.render('login', { error: 'Ungültige Anmeldedaten' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { error: 'Ein Fehler ist aufgetreten' });
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
  if (req.session.user.role !== 'kastellan') {
    return res.redirect('/');
  }
  res.render('kastellan/dashboard');
});

app.get('/hausmeister/dashboard', requireLogin, (req, res) => {
  if (req.session.user.role !== 'hausmeister') {
    return res.redirect('/');
  }
  res.render('hausmeister/dashboard');
});

app.get('/mitarbeiter/dashboard', requireLogin, (req, res) => {
  if (req.session.user.role !== 'mitarbeiter') {
    return res.redirect('/');
  }
  res.render('mitarbeiter/dashboard');
});

// Logout route
app.get('/auth/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { error: 'Ein Fehler ist aufgetreten' });
});

// Export the serverless app
exports.handler = serverless(app);
