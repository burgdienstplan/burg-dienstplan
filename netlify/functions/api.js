const express = require('express');
const mongoose = require('mongoose');
const serverless = require('serverless-http');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Models
const User = require('./models/User');
const Chat = require('./models/Chat');
const Dienst = require('./models/Dienst');
const Fuehrung = require('./models/Fuehrung');

const app = express();
const router = express.Router();

// Middleware
router.use(cors());
router.use(express.json());

// MongoDB Verbindung
const MONGODB_URI = "mongodb+srv://Steindorfer:Ratzendorf55@cluster0.ay1oe.mongodb.net/dienstplan?retryWrites=true&w=majority&appName=Cluster0";
const JWT_SECRET = "burgdienstplan2025";

mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB verbunden'))
    .catch(err => console.error('MongoDB Verbindungsfehler:', err));

// Auth Middleware
const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) throw new Error('Kein Token');

        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Nicht autorisiert' });
    }
};

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { pin } = req.body;
        console.log('Login-Versuch mit PIN:', pin);

        // Alle aktiven Benutzer finden
        const users = await User.find({ aktiv: true });
        console.log('Gefundene aktive Benutzer:', users.length);

        // PIN mit jedem Benutzer vergleichen
        for (const user of users) {
            if (await bcrypt.compare(pin, user.pin)) {
                console.log('PIN korrekt für Benutzer:', user.name);
                const token = jwt.sign({ userId: user._id }, JWT_SECRET);
                return res.json({
                    token,
                    role: user.rolle,
                    userId: user._id
                });
            }
        }

        console.log('PIN falsch für alle Benutzer');
        res.status(401).json({ message: 'Ungültiger PIN' });
    } catch (error) {
        console.error('Login-Fehler:', error);
        res.status(500).json({ message: 'Server-Fehler' });
    }
});

// Dienste Routes
router.get('/dienste', auth, async (req, res) => {
    try {
        const { year, month, mitarbeiterId } = req.query;
        
        const query = {};
        if (year && month) {
            const startDate = `${year}-${month.padStart(2, '0')}-01`;
            const endDate = `${year}-${month.padStart(2, '0')}-31`;
            query.datum = { $gte: startDate, $lte: endDate };
        }
        if (mitarbeiterId) {
            query.mitarbeiterId = mitarbeiterId;
        }

        const dienste = await Dienst.find(query).sort({ datum: 1 });
        res.json(dienste);
    } catch (error) {
        res.status(500).json({ message: 'Fehler beim Abrufen der Dienste' });
    }
});

router.post('/dienste', auth, async (req, res) => {
    try {
        const { datum, position } = req.body;
        
        // Prüfen ob Position an diesem Tag schon besetzt ist
        const existing = await Dienst.findOne({ datum, position });
        if (existing) {
            return res.status(400).json({ message: 'Position ist bereits besetzt' });
        }

        const dienst = new Dienst(req.body);
        await dienst.save();
        res.status(201).json(dienst);
    } catch (error) {
        res.status(500).json({ message: 'Fehler beim Erstellen des Dienstes' });
    }
});

router.put('/dienste/:id', auth, async (req, res) => {
    try {
        const { datum, position } = req.body;
        
        // Prüfen ob neue Position an diesem Tag schon besetzt ist
        const existing = await Dienst.findOne({
            _id: { $ne: req.params.id },
            datum,
            position
        });
        if (existing) {
            return res.status(400).json({ message: 'Position ist bereits besetzt' });
        }

        const dienst = await Dienst.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!dienst) {
            return res.status(404).json({ message: 'Dienst nicht gefunden' });
        }

        res.json(dienst);
    } catch (error) {
        res.status(500).json({ message: 'Fehler beim Aktualisieren des Dienstes' });
    }
});

router.delete('/dienste/:id', auth, async (req, res) => {
    try {
        const dienst = await Dienst.findByIdAndDelete(req.params.id);
        if (!dienst) {
            return res.status(404).json({ message: 'Dienst nicht gefunden' });
        }
        res.json({ message: 'Dienst gelöscht' });
    } catch (error) {
        res.status(500).json({ message: 'Fehler beim Löschen des Dienstes' });
    }
});

// Führungen Routes
router.get('/fuehrungen', auth, async (req, res) => {
    try {
        const { year, month, fuehrerId } = req.query;
        
        const query = {};
        if (year && month) {
            const startDate = `${year}-${month.padStart(2, '0')}-01`;
            const endDate = `${year}-${month.padStart(2, '0')}-31`;
            query.datum = { $gte: startDate, $lte: endDate };
        }
        if (fuehrerId) {
            query.fuehrerId = fuehrerId;
        }

        const fuehrungen = await Fuehrung.find(query).sort({ datum: 1 });
        res.json(fuehrungen);
    } catch (error) {
        res.status(500).json({ message: 'Fehler beim Abrufen der Führungen' });
    }
});

router.post('/fuehrungen', auth, async (req, res) => {
    try {
        const fuehrung = new Fuehrung(req.body);
        await fuehrung.save();
        res.status(201).json(fuehrung);
    } catch (error) {
        res.status(500).json({ message: 'Fehler beim Erstellen der Führung' });
    }
});

router.put('/fuehrungen/:id', auth, async (req, res) => {
    try {
        const fuehrung = await Fuehrung.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!fuehrung) {
            return res.status(404).json({ message: 'Führung nicht gefunden' });
        }

        res.json(fuehrung);
    } catch (error) {
        res.status(500).json({ message: 'Fehler beim Aktualisieren der Führung' });
    }
});

router.delete('/fuehrungen/:id', auth, async (req, res) => {
    try {
        const fuehrung = await Fuehrung.findByIdAndDelete(req.params.id);
        if (!fuehrung) {
            return res.status(404).json({ message: 'Führung nicht gefunden' });
        }
        res.json({ message: 'Führung gelöscht' });
    } catch (error) {
        res.status(500).json({ message: 'Fehler beim Löschen der Führung' });
    }
});

// Chat Routes
router.get('/chat', auth, async (req, res) => {
    try {
        const messages = await Chat.find()
            .sort({ zeitstempel: -1 })
            .limit(50);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Fehler beim Abrufen der Nachrichten' });
    }
});

router.post('/chat', auth, async (req, res) => {
    try {
        const message = new Chat({
            von: req.userId,
            text: req.body.text,
            zeitstempel: new Date()
        });
        await message.save();
        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: 'Fehler beim Senden der Nachricht' });
    }
});

// Mitarbeiter Routes
router.get('/mitarbeiter', auth, async (req, res) => {
    try {
        const mitarbeiter = await User.find({ aktiv: true })
            .select('-pin')
            .sort({ name: 1 });
        res.json(mitarbeiter);
    } catch (error) {
        res.status(500).json({ message: 'Fehler beim Abrufen der Mitarbeiter' });
    }
});

// Benutzer-Management Routes (nur für Admin)
router.post('/users', async (req, res) => {
    try {
        const { name, pin, rolle, aktiv } = req.body;

        // PIN hashen
        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash(pin, salt);

        // Benutzer erstellen
        const user = new User({
            name,
            pin: hashedPin,
            rolle,
            aktiv
        });

        await user.save();
        res.status(201).json({ 
            message: 'Benutzer erstellt',
            user: {
                id: user._id,
                name: user.name,
                rolle: user.rolle,
                aktiv: user.aktiv
            }
        });
    } catch (error) {
        console.error('Fehler beim Erstellen des Benutzers:', error);
        res.status(500).json({ message: 'Fehler beim Erstellen des Benutzers' });
    }
});

router.put('/users/:id', auth, async (req, res) => {
    try {
        const { name, pin, rolle, aktiv } = req.body;
        const update = { name, rolle, aktiv };

        // Wenn PIN geändert wurde, neu hashen
        if (pin) {
            const salt = await bcrypt.genSalt(10);
            update.pin = await bcrypt.hash(pin, salt);
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true }
        ).select('-pin');

        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Fehler beim Aktualisieren des Benutzers' });
    }
});

app.use('/.netlify/functions/api', router);

exports.handler = serverless(app);
