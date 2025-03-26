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

// MongoDB Verbindung mit Fehlerbehandlung
const MONGODB_URI = 'mongodb+srv://Steindorfer:Ratzendorf55@cluster0.ay1oe.mongodb.net/burgdienstplan?retryWrites=true&w=majority&appName=Cluster0';

const connectDB = async () => {
  try {
    debug('Versuche MongoDB-Verbindung...');
    
    if (!MONGODB_URI) {
      throw new Error('MongoDB URI ist nicht definiert');
    }
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    debug('MongoDB erfolgreich verbunden');
    
    // Test-Query ausführen
    const collections = await mongoose.connection.db.listCollections().toArray();
    debug('Verfügbare Collections:', collections.map(c => c.name));
    
  } catch (err) {
    debug('MongoDB Verbindungsfehler:', err);
    throw err;
  }
};

// Session-Konfiguration für Netlify
const SESSION_SECRET = 'BurgHochosterwitzSecretKey2024';

const sessionConfig = {
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Auf false gesetzt für Entwicklung
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 Stunden
  }
};

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
  debug('Session Status:', { 
    sessionExists: !!req.session,
    userExists: !!req.session?.user,
    userRole: req.session?.user?.role
  });
  
  if (!req.session.user) {
    debug('Keine Benutzer-Session gefunden, Weiterleitung zur Login-Seite');
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
    debug('Login-Versuch:', { 
      username: req.body.username,
      bodyExists: !!req.body,
      hasPassword: !!req.body.password
    });
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      debug('Fehlende Login-Daten');
      return res.status(400).json({ error: 'Benutzername und Passwort sind erforderlich' });
    }
    
    const employee = await Employee.findOne({ username });
    debug('Gefundener Mitarbeiter:', { 
      exists: !!employee,
      active: employee?.isActive,
      role: employee?.role
    });
    
    if (!employee || !employee.isActive) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }
    
    const isValidPassword = await bcrypt.compare(password, employee.password);
    debug('Passwort-Überprüfung:', { isValid: isValidPassword });
    
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
    
    debug('Login erfolgreich:', { 
      sessionID: req.sessionID,
      userRole: employee.role
    });
    
    res.json({ role: employee.role });
  } catch (error) {
    debug('Login-Fehler:', error);
    res.status(500).json({ error: 'Server Fehler beim Login', details: error.message });
  }
});

// Logout Route
app.post('/auth/logout', (req, res) => {
  debug('Logout-Versuch');
  req.session.destroy();
  res.json({ message: 'Erfolgreich abgemeldet' });
});

// Frontend Routen mit Debugging
app.get('/', (req, res) => {
  debug('Hauptseite aufgerufen, Session:', { 
    sessionExists: !!req.session,
    userExists: !!req.session?.user
  });
  
  if (req.session.user) {
    debug('Benutzer bereits angemeldet, Weiterleitung zum Dashboard');
    return res.redirect('/dashboard');
  }
  
  res.render('login', { error: null });
});

app.get('/dashboard', requireAuth, (req, res) => {
  debug('Dashboard aufgerufen:', { role: req.session.user.role });
  
  const viewData = { user: req.session.user };
  
  switch(req.session.user.role) {
    case 'kastellan':
      res.render('kastellan/dashboard', viewData);
      break;
    case 'hausmeister':
      res.render('hausmeister/dashboard', viewData);
      break;
    case 'museumsfuehrer':
      res.render('museumsfuehrer/dashboard', viewData);
      break;
    default:
      res.render('mitarbeiter/dashboard', viewData);
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
  res.status(500).json({ 
    error: 'Ein Fehler ist aufgetreten', 
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Export für Netlify Functions
const handler = serverless(app);
exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    debug('Netlify Function aufgerufen:', { 
      path: event.path,
      method: event.httpMethod,
      headers: event.headers
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
