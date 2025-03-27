const express = require('express');
const serverless = require('serverless-http');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Employee = require('./models/employee');

const app = express();

// MongoDB Verbindung
const MONGODB_URI = 'mongodb+srv://Steindorfer:Ratzendorf55@cluster0.ay1oe.mongodb.net/burgdienstplan?retryWrites=true&w=majority&appName=Cluster0';

// Verbindung herstellen
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error('MongoDB Verbindungsfehler:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Middleware
app.use(session({
  secret: 'BurgHochosterwitzSecretKey2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 Stunden
  }
}));

// Login-Seite
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/.netlify/functions/server/dashboard');
  }
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Burg Hochosterwitz - Login</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background: #f5f5f5;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background-image: url('https://www.burghochosterwitz.com/wp-content/uploads/2023/12/Burg-Hochosterwitz-Winter-2023-Foto-Burg-Hochosterwitz-scaled.jpg');
                background-size: cover;
                background-position: center;
            }
            .login-box {
                background: rgba(255, 255, 255, 0.95);
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: 400px;
                margin: 20px;
            }
            .logo {
                text-align: center;
                margin-bottom: 2rem;
            }
            .logo img {
                max-width: 200px;
                height: auto;
            }
            h1 {
                color: #9B0600;
                text-align: center;
                margin-bottom: 2rem;
                font-size: 1.5rem;
            }
            .input-group {
                margin-bottom: 1rem;
            }
            .input-group label {
                display: block;
                margin-bottom: 0.5rem;
                color: #333;
            }
            .input-group input {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 1rem;
            }
            button {
                width: 100%;
                padding: 0.75rem;
                background: #9B0600;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 1rem;
                cursor: pointer;
                transition: background-color 0.3s;
            }
            button:hover {
                background: #7a0500;
            }
            .error {
                color: #9B0600;
                text-align: center;
                margin-top: 1rem;
            }
        </style>
    </head>
    <body>
        <div class="login-box">
            <div class="logo">
                <img src="https://www.burghochosterwitz.com/wp-content/uploads/2023/12/Logo-Burg-Hochosterwitz.png" alt="Burg Hochosterwitz">
            </div>
            <h1>Mitarbeiter-Login</h1>
            <form id="loginForm">
                <div class="input-group">
                    <label for="username">Benutzername</label>
                    <input type="text" id="username" name="username" required>
                </div>
                <div class="input-group">
                    <label for="password">Passwort</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit">Anmelden</button>
                <div id="error" class="error"></div>
            </form>
        </div>
        <script>
            document.getElementById('loginForm').onsubmit = async (e) => {
                e.preventDefault();
                const error = document.getElementById('error');
                error.textContent = '';
                
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                try {
                    console.log('Login-Versuch für:', username);
                    const res = await fetch('/.netlify/functions/server/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });
                    
                    console.log('Server-Antwort Status:', res.status);
                    const data = await res.json();
                    console.log('Server-Antwort:', data);
                    
                    if (data.success) {
                        window.location.href = '/.netlify/functions/server/dashboard';
                    } else {
                        error.textContent = data.error || 'Anmeldung fehlgeschlagen';
                    }
                } catch (err) {
                    console.error('Login-Fehler:', err);
                    error.textContent = 'Ein Fehler ist aufgetreten';
                }
            };
        </script>
    </body>
    </html>
  `);
});

// Login Route
app.post('/auth/login', async (req, res) => {
  try {
    console.log('Login-Anfrage erhalten:', req.body);
    
    const { username, password } = req.body;
    const employee = await Employee.findOne({ username, isActive: true });
    
    if (!employee) {
      console.log('Benutzer nicht gefunden:', username);
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }
    
    const isValid = await bcrypt.compare(password, employee.password);
    if (!isValid) {
      console.log('Falsches Passwort für:', username);
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }
    
    req.session.user = {
      id: employee._id,
      username: employee.username,
      firstName: employee.firstName,
      lastName: employee.lastName,
      role: employee.role
    };
    
    console.log('Login erfolgreich für:', username);
    res.json({ success: true });
  } catch (error) {
    console.error('Login-Fehler:', error);
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

// Kastellan erstellen
app.get('/setup', async (req, res) => {
  try {
    console.log('Setup-Anfrage erhalten');
    
    // Prüfen ob der Kastellan bereits existiert
    const exists = await Employee.findOne({ username: 'steindorfer' });
    if (exists) {
      console.log('Kastellan existiert bereits');
      return res.json({ message: 'Kastellan existiert bereits' });
    }
    
    // Passwort hashen
    const hashedPassword = await bcrypt.hash('Ratzendorf55', 10);
    
    // Kastellan erstellen
    const kastellan = new Employee({
      username: 'steindorfer',
      password: hashedPassword,
      firstName: 'Steindorfer',
      lastName: 'Kastellan',
      role: 'kastellan',
      isActive: true
    });
    
    await kastellan.save();
    console.log('Kastellan erfolgreich erstellt');
    res.json({ message: 'Kastellan erfolgreich erstellt' });
  } catch (error) {
    console.error('Setup-Fehler:', error);
    res.status(500).json({ error: 'Server-Fehler', details: error.message });
  }
});

// Dashboard
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    console.log('Nicht eingeloggt, Weiterleitung zum Login');
    return res.redirect('/');
  }
  
  console.log('Dashboard-Zugriff für:', req.session.user.username);
  
  const user = req.session.user;
  let content = '';
  
  // Kastellan Dashboard
  if (user.role === 'kastellan') {
    content = `
      <h2>Kastellan Dashboard</h2>
      <div class="dashboard-grid">
        <div class="dashboard-item">
          <h3>Dienstplan</h3>
          <p>Aktuelle Woche verwalten</p>
          <a href="/.netlify/functions/server/schedule" class="button">Öffnen</a>
        </div>
        <div class="dashboard-item">
          <h3>Mitarbeiter</h3>
          <p>Mitarbeiter verwalten</p>
          <a href="/.netlify/functions/server/employees" class="button">Öffnen</a>
        </div>
        <div class="dashboard-item">
          <h3>Hausmeister-Aufgaben</h3>
          <p>Aufgaben erstellen und zuweisen</p>
          <a href="/.netlify/functions/server/tasks" class="button">Öffnen</a>
        </div>
        <div class="dashboard-item">
          <h3>Lift-Wartung</h3>
          <p>Wartungsplan verwalten</p>
          <a href="/.netlify/functions/server/maintenance" class="button">Öffnen</a>
        </div>
      </div>
    `;
  }
  
  // Hausmeister Dashboard
  else if (user.role === 'hausmeister') {
    content = `
      <h2>Hausmeister Dashboard</h2>
      <div class="dashboard-grid">
        <div class="dashboard-item">
          <h3>Meine Aufgaben</h3>
          <p>Aktuelle Aufgaben anzeigen</p>
          <a href="/.netlify/functions/server/tasks" class="button">Öffnen</a>
        </div>
        <div class="dashboard-item">
          <h3>Lift-Wartung</h3>
          <p>Wartungstermine anzeigen</p>
          <a href="/.netlify/functions/server/maintenance" class="button">Öffnen</a>
        </div>
      </div>
    `;
  }
  
  // Museumsführer Dashboard
  else {
    content = `
      <h2>Museumsführer Dashboard</h2>
      <div class="dashboard-grid">
        <div class="dashboard-item">
          <h3>Mein Dienstplan</h3>
          <p>Aktuelle Woche anzeigen</p>
          <a href="/.netlify/functions/server/schedule" class="button">Öffnen</a>
        </div>
      </div>
    `;
  }
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Burg Hochosterwitz - Dashboard</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background: #f5f5f5;
            }
            .header {
                background: #9B0600;
                color: white;
                padding: 1rem;
                margin-bottom: 2rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .welcome {
                margin: 0;
            }
            .logout {
                background: none;
                border: 1px solid white;
                color: white;
                padding: 0.5rem 1rem;
                cursor: pointer;
                border-radius: 4px;
            }
            .logout:hover {
                background: rgba(255,255,255,0.1);
            }
            .content {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }
            .dashboard-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1.5rem;
                margin-top: 2rem;
            }
            .dashboard-item {
                background: white;
                padding: 1.5rem;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .dashboard-item h3 {
                color: #9B0600;
                margin: 0 0 1rem 0;
            }
            .dashboard-item p {
                color: #666;
                margin: 0 0 1.5rem 0;
            }
            .button {
                display: inline-block;
                padding: 0.75rem 1.5rem;
                background: #9B0600;
                color: white;
                text-decoration: none;
                border-radius: 4px;
                transition: background-color 0.3s;
            }
            .button:hover {
                background: #7a0500;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1 class="welcome">Willkommen, ${user.firstName} ${user.lastName}</h1>
            <button class="logout" onclick="logout()">Abmelden</button>
        </div>
        <div class="content">
            ${content}
        </div>
        <script>
            async function logout() {
                try {
                    await fetch('/.netlify/functions/server/auth/logout', {
                        method: 'POST'
                    });
                    window.location.href = '/';
                } catch (err) {
                    console.error('Logout-Fehler:', err);
                }
            }
        </script>
    </body>
    </html>
  `);
});

// Logout Route
app.post('/auth/logout', (req, res) => {
  console.log('Logout für:', req.session.user?.username);
  req.session.destroy();
  res.json({ success: true });
});

module.exports.handler = serverless(app);
