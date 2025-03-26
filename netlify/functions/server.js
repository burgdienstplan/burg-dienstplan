const express = require('express');
const serverless = require('serverless-http');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Employee = require('./models/employee');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'BurgHochosterwitzSecretKey2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// MongoDB Verbindung
const MONGODB_URI = 'mongodb+srv://Steindorfer:Ratzendorf55@cluster0.ay1oe.mongodb.net/burgdienstplan?retryWrites=true&w=majority&appName=Cluster0';

// Login-Seite
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
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
                
                try {
                    const res = await fetch('/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            username: document.getElementById('username').value,
                            password: document.getElementById('password').value
                        })
                    });
                    const data = await res.json();
                    
                    if (res.ok) {
                        window.location.href = '/dashboard';
                    } else {
                        error.textContent = data.error || 'Anmeldung fehlgeschlagen';
                    }
                } catch (err) {
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
    await mongoose.connect(MONGODB_URI);
    
    const { username, password } = req.body;
    const employee = await Employee.findOne({ username, isActive: true });
    
    if (!employee) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }
    
    const isValid = await bcrypt.compare(password, employee.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }
    
    req.session.user = {
      id: employee._id,
      username: employee.username,
      firstName: employee.firstName,
      lastName: employee.lastName,
      role: employee.role
    };
    
    res.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

// Dashboard
app.get('/dashboard', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  
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
          <a href="/schedule" class="button">Öffnen</a>
        </div>
        <div class="dashboard-item">
          <h3>Mitarbeiter</h3>
          <p>Mitarbeiter verwalten</p>
          <a href="/employees" class="button">Öffnen</a>
        </div>
        <div class="dashboard-item">
          <h3>Hausmeister-Aufgaben</h3>
          <p>Aufgaben erstellen und zuweisen</p>
          <a href="/tasks" class="button">Öffnen</a>
        </div>
        <div class="dashboard-item">
          <h3>Lift-Wartung</h3>
          <p>Wartungsplan verwalten</p>
          <a href="/maintenance" class="button">Öffnen</a>
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
          <a href="/tasks" class="button">Öffnen</a>
        </div>
        <div class="dashboard-item">
          <h3>Lift-Wartung</h3>
          <p>Wartungstermine anzeigen</p>
          <a href="/maintenance" class="button">Öffnen</a>
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
          <a href="/schedule" class="button">Öffnen</a>
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
                padding: 0;
                background: #f5f5f5;
            }
            .header {
                background: #9B0600;
                color: white;
                padding: 1rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .header h1 {
                margin: 0;
                font-size: 1.2rem;
            }
            .user-info {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            .logout {
                color: white;
                text-decoration: none;
                padding: 0.5rem 1rem;
                border: 1px solid white;
                border-radius: 4px;
            }
            .container {
                max-width: 1200px;
                margin: 2rem auto;
                padding: 0 1rem;
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
            <h1>Burg Hochosterwitz</h1>
            <div class="user-info">
                <span>${user.firstName} ${user.lastName} (${user.role})</span>
                <a href="/auth/logout" class="logout">Abmelden</a>
            </div>
        </div>
        <div class="container">
            ${content}
        </div>
        <script>
            // Abmelden
            document.querySelector('.logout').onclick = async (e) => {
                e.preventDefault();
                await fetch('/auth/logout', { method: 'POST' });
                window.location.href = '/';
            };
        </script>
    </body>
    </html>
  `);
});

// Logout Route
app.post('/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Kastellan erstellen
app.get('/setup', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    
    // Prüfen ob der Kastellan bereits existiert
    const exists = await Employee.findOne({ username: 'steindorfer' });
    if (exists) {
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
    res.json({ message: 'Kastellan erfolgreich erstellt' });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Server-Fehler', details: error.message });
  }
});

exports.handler = serverless(app);
