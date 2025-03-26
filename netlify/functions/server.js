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

// Debugging
const debug = (msg, obj = '') => {
  console.log(`[DEBUG] ${msg}`, obj);
};

// Umgebungsvariablen prüfen
const checkRequiredEnvVars = () => {
  const required = ['MONGODB_URI', 'SESSION_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Fehlende Umgebungsvariablen: ${missing.join(', ')}`);
  }
};

// MongoDB Verbindung mit Fehlerbehandlung
const connectDB = async () => {
  try {
    checkRequiredEnvVars();
    debug('MongoDB URI vorhanden');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI ist nicht definiert');
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    debug('MongoDB erfolgreich verbunden');
  } catch (err) {
    debug('MongoDB Verbindungsfehler:', err);
    throw err;
  }
};

// Session-Konfiguration für Netlify
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'fallback-secret-dev-only',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 Stunden
  }
};

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  sessionConfig.cookie.secure = true;
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session(sessionConfig));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Statische Dateien
app.use(express.static(path.join(__dirname, '../../public')));

// Authentifizierungs-Middleware mit Debugging
const requireAuth = (req, res, next) => {
  debug('Session:', req.session);
  if (!req.session.user) {
    debug('Keine Benutzer-Session gefunden');
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

// Login Route mit Debugging
app.post('/auth/login', async (req, res) => {
  try {
    debug('Login-Versuch:', { username: req.body.username });
    
    const { username, password } = req.body;
    const employee = await Employee.findOne({ username });
    
    if (!employee || !employee.isActive) {
      debug('Ungültiger Login:', { username, exists: !!employee, active: employee?.isActive });
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }
    
    const isValidPassword = await bcrypt.compare(password, employee.password);
    
    if (!isValidPassword) {
      debug('Falsches Passwort');
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }
    
    req.session.user = {
      _id: employee._id,
      username: employee.username,
      firstName: employee.firstName,
      lastName: employee.lastName,
      role: employee.role
    };
    
    debug('Login erfolgreich:', { role: employee.role });
    res.json({ role: employee.role });
  } catch (error) {
    debug('Login-Fehler:', error);
    res.status(500).json({ error: 'Server Fehler beim Login' });
  }
});

// Logout Route
app.post('/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Erfolgreich abgemeldet' });
});

// Frontend Routen mit Debugging
app.get('/', (req, res) => {
  debug('Hauptseite aufgerufen, Session:', req.session);
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('login');
});

app.get('/dashboard', requireAuth, (req, res) => {
  debug('Dashboard aufgerufen:', { role: req.session.user.role });
  switch(req.session.user.role) {
    case 'kastellan':
      res.render('kastellan/dashboard', { user: req.session.user });
      break;
    case 'hausmeister':
      res.render('hausmeister/dashboard', { user: req.session.user });
      break;
    case 'museumsfuehrer':
      res.render('museumsfuehrer/dashboard', { user: req.session.user });
      break;
    default:
      res.render('mitarbeiter/dashboard', { user: req.session.user });
  }
});

// Dienstplan Route
app.get('/schedule', requireAuth, (req, res) => {
  res.render('schedule', { user: req.session.user });
});

// Mitarbeiterverwaltung (nur Kastellan)
app.get('/mitarbeiter', requireAuth, (req, res) => {
  if (req.session.user.role !== 'kastellan') {
    return res.redirect('/dashboard');
  }
  res.render('kastellan/employees', { user: req.session.user });
});

// Hausmeister Routen
app.get('/tasks', requireAuth, requireMaintenance, (req, res) => {
  res.render('hausmeister/tasks', { user: req.session.user });
});

app.get('/lift', requireAuth, requireMaintenance, (req, res) => {
  res.render('hausmeister/lift', { user: req.session.user });
});

app.get('/inventory', requireAuth, requireMaintenance, (req, res) => {
  res.render('hausmeister/inventory', { user: req.session.user });
});

// Profil Route
app.get('/profile', requireAuth, (req, res) => {
  res.render('profile', { user: req.session.user });
});

// Fehlerbehandlung
app.use((err, req, res, next) => {
  debug('Server-Fehler:', err);
  res.status(500).json({ error: 'Ein Fehler ist aufgetreten', details: err.message });
});

// Export für Netlify Functions
const handler = serverless(app);
exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    debug('Netlify Function aufgerufen:', { 
      path: event.path,
      method: event.httpMethod
    });
    
    // MongoDB verbinden
    await connectDB();
    
    const result = await handler(event, context);
    debug('Handler-Ergebnis:', { 
      statusCode: result.statusCode,
      hasBody: !!result.body
    });
    return result;
  } catch (error) {
    debug('Handler-Fehler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Ein Fehler ist aufgetreten',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
