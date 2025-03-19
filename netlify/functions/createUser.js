const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');

exports.handler = async (event, context) => {
    // Nur POST-Anfragen erlauben
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Methode nicht erlaubt' })
        };
    }

    try {
        // Verbindung zur Datenbank herstellen
        if (!mongoose.connections[0].readyState) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        const { username, password, role, displayName } = JSON.parse(event.body);

        // Passwort hashen
        const hashedPassword = await bcrypt.hash(password, 10);

        // Benutzer erstellen
        const user = new User({
            username,
            password: hashedPassword,
            role,
            displayName
        });

        await user.save();

        return {
            statusCode: 201,
            body: JSON.stringify({ 
                message: 'Benutzer erfolgreich erstellt',
                user: {
                    username: user.username,
                    role: user.role,
                    displayName: user.displayName
                }
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                message: 'Fehler beim Erstellen des Benutzers',
                error: error.message 
            })
        };
    }
};
