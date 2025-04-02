const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// MongoDB Verbindung
mongoose.connect('mongodb+srv://Steindorfer:Ratzendorf55@cluster0.ay1oe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error('MongoDB Fehler:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'mitarbeiter', 'museumsfuehrer'], required: true },
  name: String,
  email: String
});

const User = mongoose.model('User', userSchema);

exports.handler = async function(event, context) {
  // Parse request body
  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch (err) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Ungültige Anfrage' }) };
    }
  }

  // Route handling
  switch (event.path) {
    case '/.netlify/functions/server':
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Burg Hochosterwitz API' })
      };

    case '/.netlify/functions/server/setup':
      if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Methode nicht erlaubt' }) };
      }
      try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
          return { statusCode: 400, body: JSON.stringify({ message: 'Admin existiert bereits' }) };
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = new User({
          username: 'admin',
          password: hashedPassword,
          role: 'admin',
          name: 'Administrator',
          email: 'admin@burg.at'
        });

        await admin.save();
        return { statusCode: 200, body: JSON.stringify({ message: 'Admin erstellt' }) };
      } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: 'Server Fehler' }) };
      }

    case '/.netlify/functions/server/login':
      if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Methode nicht erlaubt' }) };
      }
      try {
        const { username, password } = body;
        const user = await User.findOne({ username });
        
        if (!user) {
          return { statusCode: 401, body: JSON.stringify({ message: 'Benutzer nicht gefunden' }) };
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return { statusCode: 401, body: JSON.stringify({ message: 'Falsches Passwort' }) };
        }

        const token = jwt.sign(
          { userId: user._id, role: user.role },
          'burgHochosterwitzSecret',
          { expiresIn: '24h' }
        );

        return {
          statusCode: 200,
          body: JSON.stringify({
            token,
            user: { id: user._id, role: user.role, name: user.name }
          })
        };
      } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: 'Server Fehler' }) };
      }

    default:
      return { statusCode: 404, body: JSON.stringify({ message: 'Route nicht gefunden' }) };
  }
};
