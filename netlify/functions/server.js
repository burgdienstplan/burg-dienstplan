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

// Dienstplan Schema
const dienstSchema = new mongoose.Schema({
  datum: { type: Date, required: true },
  bereich: { type: String, enum: ['shop_eintritt', 'shop_museum', 'eintritt', 'fuehrung'], required: true },
  mitarbeiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['angefragt', 'bestaetigt', 'abgelehnt'], default: 'angefragt' },
  zeit: {
    von: { type: String, required: true },
    bis: { type: String, required: true }
  }
});

const User = mongoose.model('User', userSchema);
const Dienst = mongoose.model('Dienst', dienstSchema);

// Auth Middleware
const verifyToken = async (event) => {
  try {
    const token = event.headers.authorization?.split(' ')[1];
    if (!token) {
      return { error: 'Nicht autorisiert', statusCode: 401 };
    }

    const decoded = jwt.verify(token, 'burgHochosterwitzSecret');
    const user = await User.findById(decoded.userId);
    if (!user) {
      return { error: 'Benutzer nicht gefunden', statusCode: 401 };
    }

    return { user };
  } catch (error) {
    return { error: 'Ungültiger Token', statusCode: 401 };
  }
};

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

    case '/.netlify/functions/server/dienste':
      // Auth Check
      const auth = await verifyToken(event);
      if (auth.error) {
        return { statusCode: auth.statusCode, body: JSON.stringify({ message: auth.error }) };
      }

      if (event.httpMethod === 'GET') {
        try {
          const dienste = await Dienst.find().populate('mitarbeiter', '-password');
          return { statusCode: 200, body: JSON.stringify(dienste) };
        } catch (error) {
          return { statusCode: 500, body: JSON.stringify({ message: 'Server Fehler' }) };
        }
      }

      if (event.httpMethod === 'POST') {
        try {
          const dienst = new Dienst({
            ...body,
            mitarbeiter: auth.user._id
          });
          await dienst.save();
          return { statusCode: 200, body: JSON.stringify(dienst) };
        } catch (error) {
          return { statusCode: 500, body: JSON.stringify({ message: 'Server Fehler' }) };
        }
      }

      return { statusCode: 405, body: JSON.stringify({ message: 'Methode nicht erlaubt' }) };

    case '/.netlify/functions/server/users':
      // Auth Check
      const authUsers = await verifyToken(event);
      if (authUsers.error) {
        return { statusCode: authUsers.statusCode, body: JSON.stringify({ message: authUsers.error }) };
      }

      // Nur Admin darf User verwalten
      if (authUsers.user.role !== 'admin') {
        return { statusCode: 403, body: JSON.stringify({ message: 'Keine Berechtigung' }) };
      }

      if (event.httpMethod === 'GET') {
        try {
          const users = await User.find({}, '-password');
          return { statusCode: 200, body: JSON.stringify(users) };
        } catch (error) {
          return { statusCode: 500, body: JSON.stringify({ message: 'Server Fehler' }) };
        }
      }

      if (event.httpMethod === 'POST') {
        try {
          const { username, password, role, name, email } = body;
          const userExists = await User.findOne({ username });
          if (userExists) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Benutzer existiert bereits' }) };
          }

          const hashedPassword = await bcrypt.hash(password, 10);
          const user = new User({
            username,
            password: hashedPassword,
            role,
            name,
            email
          });

          await user.save();
          return { statusCode: 200, body: JSON.stringify({ message: 'Benutzer erstellt' }) };
        } catch (error) {
          return { statusCode: 500, body: JSON.stringify({ message: 'Server Fehler' }) };
        }
      }

      return { statusCode: 405, body: JSON.stringify({ message: 'Methode nicht erlaubt' }) };

    default:
      return { statusCode: 404, body: JSON.stringify({ message: 'Route nicht gefunden' }) };
  }
};
