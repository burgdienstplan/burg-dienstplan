const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = "mongodb+srv://Steindorfer:Ratzendorf55@cluster0.ay1oe.mongodb.net/dienstplan?retryWrites=true&w=majority&appName=Cluster0";

async function resetAll() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB verbunden');

        // Alle Collections löschen
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const collection of collections) {
            await mongoose.connection.db.dropCollection(collection.name);
            console.log(`Collection ${collection.name} gelöscht`);
        }

        // User Schema
        const userSchema = new mongoose.Schema({
            name: {
                type: String,
                required: true
            },
            pin: {
                type: String,
                required: true
            },
            rolle: {
                type: String,
                enum: ['admin', 'mitarbeiter'],
                default: 'mitarbeiter'
            },
            aktiv: {
                type: Boolean,
                default: true
            }
        });

        // Dienst Schema
        const dienstSchema = new mongoose.Schema({
            mitarbeiterId: {
                type: String,
                required: true
            },
            datum: {
                type: String,
                required: true
            },
            position: {
                type: String,
                enum: ['shop', 'museum', 'eintritt', 'führungen'],
                required: true
            },
            status: {
                type: String,
                enum: ['geplant', 'angefragt', 'genehmigt', 'abgelehnt'],
                default: 'geplant'
            },
            erstelltAm: {
                type: Date,
                default: Date.now
            }
        });

        // Indizes für Dienst
        dienstSchema.index({ datum: 1, position: 1 }, { unique: true });

        const User = mongoose.model('User', userSchema);
        const Dienst = mongoose.model('Dienst', dienstSchema);

        // Admin erstellen
        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash('1234', salt);

        const admin = new User({
            name: 'Admin',
            pin: hashedPin,
            rolle: 'admin',
            aktiv: true
        });

        await admin.save();
        console.log('Admin erstellt');

        // Test-Mitarbeiter erstellen
        const mitarbeiter1 = new User({
            name: 'Max Mustermann',
            pin: await bcrypt.hash('2222', salt),
            rolle: 'mitarbeiter',
            aktiv: true
        });

        const mitarbeiter2 = new User({
            name: 'Erika Musterfrau',
            pin: await bcrypt.hash('3333', salt),
            rolle: 'mitarbeiter',
            aktiv: true
        });

        await mitarbeiter1.save();
        await mitarbeiter2.save();
        console.log('Test-Mitarbeiter erstellt');

        // Test-Dienste erstellen
        const heute = new Date();
        const dienst1 = new Dienst({
            mitarbeiterId: mitarbeiter1._id,
            datum: heute.toISOString().split('T')[0],
            position: 'shop',
            status: 'genehmigt'
        });

        const dienst2 = new Dienst({
            mitarbeiterId: mitarbeiter2._id,
            datum: heute.toISOString().split('T')[0],
            position: 'museum',
            status: 'genehmigt'
        });

        await dienst1.save();
        await dienst2.save();
        console.log('Test-Dienste erstellt');

        console.log('\nFertig! Sie können sich jetzt einloggen mit:');
        console.log('Admin: PIN 1234');
        console.log('Max Mustermann: PIN 2222');
        console.log('Erika Musterfrau: PIN 3333');

        process.exit(0);
    } catch (error) {
        console.error('Fehler:', error);
        process.exit(1);
    }
}

resetAll();
