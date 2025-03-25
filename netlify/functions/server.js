const express = require('express');
const serverless = require('serverless-http');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');

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
    secret: process.env.SESSION_SECRET || 'burgHochosterwitzSecretKey2024',
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
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Login-Route
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Burg Hochosterwitz - Login</title>
            <style>
                body {
                    font-family: 'Cinzel', serif;
                    background-color: #f5e6d3;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background-image: url('https://www.burghochosterwitz.com/fileadmin/_processed_/1/1/csm_Burg-Hochosterwitz-Luftaufnahme_2d1b3b6c3c.jpg');
                    background-size: cover;
                    background-position: center;
                }
                .login-container {
                    background-color: rgba(255, 255, 255, 0.9);
                    padding: 2rem;
                    border-radius: 10px;
                    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
                    width: 90%;
                    max-width: 400px;
                }
                h1 {
                    color: #8b0000;
                    text-align: center;
                    margin-bottom: 2rem;
                }
                .form-group {
                    margin-bottom: 1rem;
                }
                label {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: #4a4a4a;
                }
                input {
                    width: 100%;
                    padding: 0.5rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem;
                }
                button {
                    width: 100%;
                    padding: 0.75rem;
                    background-color: #8b0000;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }
                button:hover {
                    background-color: #6d0000;
                }
                .error-message {
                    color: #8b0000;
                    text-align: center;
                    margin-top: 1rem;
                }
            </style>
            <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap" rel="stylesheet">
        </head>
        <body>
            <div class="login-container">
                <h1>Burg Hochosterwitz</h1>
                <form action="/login" method="POST">
                    <div class="form-group">
                        <label for="username">Benutzername</label>
                        <input type="text" id="username" name="username" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Passwort</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <button type="submit">Anmelden</button>
                    ${req.query.error ? `<div class="error-message">${req.query.error}</div>` : ''}
                </form>
            </div>
        </body>
        </html>
    `);
});

// Login verarbeiten
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === 'admin' && password === 'Ratzendorf55') {
        req.session.userId = 'admin';
        req.session.role = 'kastellan';
        return res.redirect('/dashboard');
    }
    
    res.redirect('/?error=Ungültige Anmeldedaten');
});

// Dashboard
app.get('/dashboard', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/?error=Bitte melden Sie sich an');
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Dashboard - Burg Hochosterwitz</title>
            <style>
                body {
                    font-family: 'Cinzel', serif;
                    background-color: #f5e6d3;
                    margin: 0;
                    padding: 20px;
                }
                .dashboard {
                    background-color: white;
                    padding: 2rem;
                    border-radius: 10px;
                    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #8b0000;
                    margin-bottom: 2rem;
                }
                .welcome {
                    font-size: 1.2rem;
                    margin-bottom: 2rem;
                }
                .logout {
                    color: #8b0000;
                    text-decoration: none;
                }
                .logout:hover {
                    text-decoration: underline;
                }
            </style>
            <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap" rel="stylesheet">
        </head>
        <body>
            <div class="dashboard">
                <h1>Willkommen im Dashboard</h1>
                <div class="welcome">
                    Sie sind eingeloggt als: ${req.session.role}
                </div>
                <a href="/logout" class="logout">Ausloggen</a>
            </div>
        </body>
        </html>
    `);
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
