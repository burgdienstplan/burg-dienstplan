const express = require('express');
const serverless = require('serverless-http');
const session = require('express-session');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session
app.use(session({
  secret: 'burgHochosterwitz2025',
  resave: false,
  saveUninitialized: false
}));

// Routes
app.get('/', (req, res) => {
  res.render('login', { error: null });
});

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Einfache Authentifizierung
  if (username === 'admin' && password === 'admin2025') {
    req.session.user = {
      username: 'admin',
      role: 'kastellan'
    };
    res.redirect('/kastellan/dashboard');
  } else {
    res.render('login', { error: 'Ungültige Anmeldedaten' });
  }
});

app.get('/kastellan/dashboard', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'kastellan') {
    return res.redirect('/');
  }
  res.render('kastellan/dashboard');
});

app.get('/auth/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Handler
const handler = serverless(app);
exports.handler = async (event, context) => {
  return await handler(event, context);
};
