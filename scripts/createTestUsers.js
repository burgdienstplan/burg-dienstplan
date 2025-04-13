require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../netlify/functions/models/User');

const MONGODB_URI = process.env.MONGODB_URI;

// Test-Benutzer
const testUsers = [
    {
        name: 'Admin',
        pin: '1234',
        rolle: 'admin',
        aktiv: true
    },
    {
        name: 'Max Mustermann',
        pin: '2222',
        rolle: 'mitarbeiter',
        aktiv: true
    },
    {
        name: 'Erika Musterfrau',
        pin: '3333',
        rolle: 'mitarbeiter',
        aktiv: true
    },
    {
        name: 'John Doe',
        pin: '4444',
        rolle: 'mitarbeiter',
        aktiv: true
    }
];

async function createTestUsers() {
    try {
        // Mit MongoDB verbinden
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        console.log('MongoDB verbunden');

        // Bestehende Benutzer löschen
        await User.deleteMany({});
        console.log('Alte Benutzer gelöscht');

        // Neue Benutzer erstellen
        for (const user of testUsers) {
            // PIN hashen
            const salt = await bcrypt.genSalt(10);
            const hashedPin = await bcrypt.hash(user.pin, salt);
            
            // Benutzer speichern
            await User.create({
                ...user,
                pin: hashedPin
            });
            console.log(`Benutzer ${user.name} erstellt (PIN: ${user.pin})`);
        }

        console.log('Test-Benutzer erfolgreich erstellt!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Fehler beim Erstellen der Test-Benutzer:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

createTestUsers();
