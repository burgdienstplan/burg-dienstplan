const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const Employee = require('./models/employee');

const app = express();
app.use(express.json());

// MongoDB Verbindung
const MONGODB_URI = 'mongodb+srv://Steindorfer:Ratzendorf55@cluster0.ay1oe.mongodb.net/burgdienstplan?retryWrites=true&w=majority&appName=Cluster0';

// Login-Seite
app.get('/', (req, res) => {
  res.send(`
    <form onsubmit="event.preventDefault(); login()">
      <input type="text" id="username" placeholder="Username">
      <input type="password" id="password" placeholder="Password">
      <button type="submit">Login</button>
      <div id="message"></div>
    </form>
    <script>
      async function login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const res = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        document.getElementById('message').textContent = data.message;
      }
    </script>
  `);
});

// Login Route
app.post('/login', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('DB connected');
    
    const user = await Employee.findOne({ username: req.body.username });
    console.log('Found user:', user);
    
    if (!user) {
      return res.json({ message: 'User not found' });
    }
    
    if (user.password !== req.body.password) {
      return res.json({ message: 'Wrong password' });
    }
    
    res.json({ message: 'Login success!' });
  } catch (error) {
    console.error('Error:', error);
    res.json({ message: 'Server error' });
  }
});

// Admin erstellen
app.get('/setup', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const admin = new Employee({
      username: 'admin',
      password: 'Ratzendorf55',
      role: 'kastellan'
    });
    
    await admin.save();
    res.json({ message: 'Admin created' });
  } catch (error) {
    res.json({ message: error.message });
  }
});

exports.handler = serverless(app);
