const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Login-Seite anzeigen
router.get('/login', (req, res) => {
    res.render('login', { error: req.query.error });
});

// Login verarbeiten
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Benutzer finden
        const user = await User.findOne({ username });
        if (!user) {
            return res.redirect('/login?error=Ungültige Anmeldedaten');
        }

        // Passwort prüfen
        const isValid = await user.comparePassword(password);
        if (!isValid) {
            return res.redirect('/login?error=Ungültige Anmeldedaten');
        }

        // Session setzen
        req.session.userId = user._id;
        req.session.role = user.role;
        req.session.username = user.username;

        // Weiterleitung basierend auf Rolle
        switch (user.role) {
            case 'kastellan':
                res.redirect('/kastellan/dashboard');
                break;
            case 'hausmeister':
                res.redirect('/hausmeister/dashboard');
                break;
            case 'shop':
                res.redirect('/shop/dashboard');
                break;
            default:
                res.redirect('/');
        }
    } catch (error) {
        console.error('Login-Fehler:', error);
        res.redirect('/login?error=Ein Fehler ist aufgetreten');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout-Fehler:', err);
        }
        res.redirect('/login');
    });
});

module.exports = router;
