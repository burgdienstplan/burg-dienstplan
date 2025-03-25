const express = require('express');
const serverless = require('serverless-http');
const session = require('express-session');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    <title>Dienstplan - Login</title>
    <style>
        body { font-family: Arial; margin: 40px; }
        .login-form { max-width: 300px; margin: 0 auto; }
        input { width: 100%; padding: 8px; margin: 8px 0; }
        button { width: 100%; padding: 8px; background: #333; color: white; border: none; }
    </style>
</head>
<body>
    <div class="login-form">
        <h2>Dienstplan Login</h2>
        <form action="/auth/login" method="POST">
            <input type="text" name="username" placeholder="Benutzername" required>
            <input type="password" name="password" placeholder="Passwort" required>
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
    <title>Dienstplan - Dashboard</title>
    <style>
        body { font-family: Arial; margin: 40px; }
        .dashboard { max-width: 800px; margin: 0 auto; }
        .logout { float: right; }
    </style>
</head>
<body>
    <div class="dashboard">
        <a href="/auth/logout" class="logout">Abmelden</a>
        <h2>Kastellan Dashboard</h2>
        <p>Willkommen im Dienstplan-System</p>
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
