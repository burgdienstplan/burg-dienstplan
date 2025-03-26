const express = require('express');
const serverless = require('serverless-http');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const employeeRoutes = require('./routes/employeeRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const maintenanceController = require('./controllers/maintenanceController');
const Employee = require('./models/employee');

const app = express();

// MongoDB Verbindung
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/burgdienstplan', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'burggeheimnis',
  resave: false,
  saveUninitialized: false
}));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Statische Dateien
app.use(express.static(path.join(__dirname, '../../public')));

// Authentifizierungs-Middleware
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  next();
};

// Hausmeister-Middleware
const requireMaintenance = (req, res, next) => {
  if (req.session.user.role !== 'hausmeister') {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }
  next();
};

// API Routen
app.use('/api', employeeRoutes);
app.use('/api', scheduleRoutes);
app.use('/api', maintenanceRoutes);

// Login Route
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const employee = await Employee.findOne({ username });
    
    if (!employee || !employee.isActive) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }
    
    const isValidPassword = await bcrypt.compare(password, employee.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }
    
    req.session.user = {
      _id: employee._id,
      username: employee.username,
      firstName: employee.firstName,
      lastName: employee.lastName,
      role: employee.role
    };
    
    res.json({ role: employee.role });
  } catch (error) {
    res.status(500).json({ error: 'Server Fehler' });
  }
});

// Logout Route
app.post('/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Erfolgreich abgemeldet' });
});

// Frontend Routen
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('login');
});

app.get('/dashboard', requireAuth, (req, res) => {
  switch(req.session.user.role) {
    case 'kastellan':
      res.render('kastellan/dashboard');
      break;
    case 'hausmeister':
      res.render('hausmeister/dashboard');
      break;
    case 'museumsfuehrer':
      res.render('museumsfuehrer/dashboard');
      break;
    default:
      res.render('mitarbeiter/dashboard');
  }
});

// Dienstplan Route
app.get('/schedule', requireAuth, (req, res) => {
  res.render('schedule');
});

// Mitarbeiterverwaltung (nur Kastellan)
app.get('/mitarbeiter', requireAuth, (req, res) => {
  if (req.session.user.role !== 'kastellan') {
    return res.redirect('/dashboard');
  }
  res.render('kastellan/employees');
});

// Hausmeister Routen
app.get('/tasks', requireAuth, requireMaintenance, (req, res) => {
  res.render('hausmeister/tasks');
});

app.get('/lift', requireAuth, requireMaintenance, (req, res) => {
  res.render('hausmeister/lift');
});

app.get('/inventory', requireAuth, requireMaintenance, (req, res) => {
  res.render('hausmeister/inventory');
});

// Profil Route
app.get('/profile', requireAuth, (req, res) => {
  res.render('profile');
});

// Fehlerbehandlung
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Ein Fehler ist aufgetreten' });
});

// Export für Netlify Functions
const handler = serverless(app);
exports.handler = async (event, context) => {
  return await handler(event, context);
};
