const express = require('express');
const serverless = require('serverless-http');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Employee = require('./models/employee');

const app = express();

// Debugging
const debug = (msg, obj = '') => {
  console.log(`[DEBUG] ${msg}`, typeof obj === 'object' ? JSON.stringify(obj, null, 2) : obj);
};

// MongoDB Verbindung
const MONGODB_URI = 'mongodb+srv://Steindorfer:Ratzendorf55@cluster0.ay1oe.mongodb.net/burgdienstplan?retryWrites=true&w=majority&appName=Cluster0';

const connectDB = async () => {
  try {
    debug('Versuche MongoDB-Verbindung...');
    await mongoose.connect(MONGODB_URI);
    debug('MongoDB erfolgreich verbunden');
    
    // Test: Liste alle Employees
    const employees = await Employee.find({});
    debug('Gefundene Mitarbeiter:', employees);
    
  } catch (err) {
    debug('MongoDB Verbindungsfehler:', err);
    throw err;
  }
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'BurgHochosterwitzSecretKey2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Login-Seite (direkt ohne Template)
app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Burg Hochosterwitz - Login</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background-color: #f5f5f5;
            }
            .login-box {
                background: white;
                padding: 20px;
                border-radius: 5px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            input {
                display: block;
                margin: 10px 0;
                padding: 5px;
                width: 200px;
            }
            button {
                width: 100%;
                padding: 10px;
                background: #9B0600;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            }
            .error {
                color: red;
                margin-top: 10px;
            }
        </style>
    </head>
    <body>
        <div class="login-box">
            <h2>Burg Hochosterwitz Login</h2>
            <form id="loginForm">
                <input type="text" name="username" placeholder="Benutzername" required>
                <input type="password" name="password" placeholder="Passwort" required>
                <button type="submit">Anmelden</button>
            </form>
            <div id="error" class="error"></div>
        </div>
        <script>
            document.getElementById('loginForm').onsubmit = async (e) => {
                e.preventDefault();
                const form = e.target;
                try {
                    const res = await fetch('/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            username: form.username.value,
                            password: form.password.value
                        })
                    });
                    const data = await res.json();
                    if (res.ok) {
                        window.location.href = '/dashboard';
                    } else {
                        document.getElementById('error').textContent = data.error;
                    }
                } catch (err) {
                    document.getElementById('error').textContent = 'Ein Fehler ist aufgetreten';
                }
            };
        </script>
    </body>
    </html>
  `;
  res.send(html);
});

// Login Route
app.post('/auth/login', async (req, res) => {
  try {
    debug('Login-Versuch:', req.body);
    const { username, password } = req.body;
    
    const employee = await Employee.findOne({ username });
    debug('Gefundener Mitarbeiter:', employee);
    
    if (!employee) {
      debug('Kein Mitarbeiter gefunden');
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }
    
    const isValid = await bcrypt.compare(password, employee.password);
    debug('Passwort-Vergleich:', { isValid });
    
    if (!isValid) {
      debug('Falsches Passwort');
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }
    
    req.session.user = {
      id: employee._id,
      username: employee.username,
      role: employee.role
    };
    
    debug('Login erfolgreich:', req.session.user);
    res.json({ role: employee.role });
  } catch (error) {
    debug('Login-Fehler:', error);
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

// Dashboard (temporär)
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.send(`
    <h1>Willkommen ${req.session.user.username}</h1>
    <p>Rolle: ${req.session.user.role}</p>
  `);
});

// Netlify Function Handler
exports.handler = async (event, context) => {
  try {
    debug('Netlify Function aufgerufen:', { 
      path: event.path,
      method: event.httpMethod,
      body: event.body 
    });
    
    await connectDB();
    return await serverless(app)(event, context);
  } catch (error) {
    debug('Handler-Fehler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server-Fehler', details: error.message })
    };
  }
};
