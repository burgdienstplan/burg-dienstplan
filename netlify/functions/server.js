const express = require('express');
const serverless = require('serverless-http');
const session = require('express-session');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session
app.use(session({
  secret: 'burgHochosterwitz2025',
  resave: false,
  saveUninitialized: false
}));

// HTML Templates
const loginPage = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Burg Hochosterwitz - Dienstplan Login</title>
    <style>
        :root {
            --burg-red: #9B0600;
            --burg-gold: #C4A777;
            --burg-brown: #4A3C31;
            --burg-beige: #F5E6D3;
        }
        
        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            background: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)),
                        url('https://www.burghochosterwitz.com/wp-content/uploads/2023/05/Burg-Hochosterwitz-Luftaufnahme-Foto-Rudi-Ferder-1.jpg');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .login-container {
            background: rgba(255, 255, 255, 0.95);
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
            width: 90%;
            max-width: 400px;
            text-align: center;
        }
        
        .logo {
            width: 200px;
            margin-bottom: 20px;
        }
        
        h2 {
            color: var(--burg-red);
            font-size: 24px;
            margin-bottom: 30px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .input-group {
            margin-bottom: 20px;
        }
        
        input {
            width: 100%;
            padding: 12px;
            margin: 8px 0;
            border: 2px solid var(--burg-gold);
            border-radius: 4px;
            font-size: 16px;
            transition: border-color 0.3s;
            box-sizing: border-box;
        }
        
        input:focus {
            border-color: var(--burg-red);
            outline: none;
        }
        
        button {
            background-color: var(--burg-red);
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.3s;
            text-transform: uppercase;
            letter-spacing: 1px;
            width: 100%;
        }
        
        button:hover {
            background-color: #7A0500;
        }
        
        @media (max-width: 480px) {
            .login-container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="login-container">
        <img src="/images/logo.jpg" alt="Burg Hochosterwitz Logo" class="logo">
        <h2>Dienstplan Login</h2>
        <form action="/auth/login" method="POST">
            <div class="input-group">
                <input type="text" name="username" placeholder="Benutzername" required>
            </div>
            <div class="input-group">
                <input type="password" name="password" placeholder="Passwort" required>
            </div>
            <button type="submit">Anmelden</button>
        </form>
    </div>
</body>
</html>
`;

const dashboardPage = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Burg Hochosterwitz - Kastellan Dashboard</title>
    <style>
        :root {
            --burg-red: #9B0600;
            --burg-gold: #C4A777;
            --burg-brown: #4A3C31;
            --burg-beige: #F5E6D3;
        }
        
        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            background-color: var(--burg-beige);
        }
        
        .header {
            background-color: var(--burg-red);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .logo {
            height: 50px;
        }
        
        .logout-btn {
            background-color: white;
            color: var(--burg-red);
            padding: 8px 20px;
            border: none;
            border-radius: 4px;
            text-decoration: none;
            font-weight: bold;
            transition: background-color 0.3s;
        }
        
        .logout-btn:hover {
            background-color: var(--burg-gold);
            color: white;
        }
        
        .dashboard-content {
            max-width: 1200px;
            margin: 40px auto;
            padding: 0 20px;
        }
        
        .menu-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        
        .menu-item {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            transition: transform 0.3s;
            cursor: pointer;
        }
        
        .menu-item:hover {
            transform: translateY(-5px);
        }
        
        .menu-item h3 {
            color: var(--burg-red);
            margin: 0 0 10px 0;
        }
        
        .menu-item p {
            color: var(--burg-brown);
            margin: 0;
        }
        
        h2 {
            color: var(--burg-red);
            text-align: center;
            margin-bottom: 30px;
        }
        
        @media (max-width: 768px) {
            .header {
                flex-direction: column;
                text-align: center;
                gap: 10px;
            }
            
            .dashboard-content {
                margin: 20px auto;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="/images/logo.jpg" alt="Burg Hochosterwitz Logo" class="logo">
        <a href="/auth/logout" class="logout-btn">Abmelden</a>
    </div>
    
    <div class="dashboard-content">
        <h2>Kastellan Dashboard</h2>
        <div class="menu-grid">
            <div class="menu-item">
                <h3>Dienstplan</h3>
                <p>Erstellen und verwalten Sie den Dienstplan</p>
            </div>
            <div class="menu-item">
                <h3>Mitarbeiter</h3>
                <p>Verwalten Sie Ihre Mitarbeiter</p>
            </div>
            <div class="menu-item">
                <h3>Hausmeister-Aufgaben</h3>
                <p>Aufgaben erstellen und zuweisen</p>
            </div>
            <div class="menu-item">
                <h3>Lift-Management</h3>
                <p>Wartung und Reparaturen verwalten</p>
            </div>
        </div>
    </div>
</body>
</html>
`;

// Routes
app.get('/', (req, res) => {
  res.send(loginPage);
});

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin2025') {
    req.session.user = {
      username: 'admin',
      role: 'kastellan'
    };
    res.redirect('/kastellan/dashboard');
  } else {
    res.send(loginPage);
  }
});

app.get('/kastellan/dashboard', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'kastellan') {
    return res.redirect('/');
  }
  res.send(dashboardPage);
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
