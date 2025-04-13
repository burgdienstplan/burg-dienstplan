const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = "mongodb+srv://Steindorfer:Ratzendorf55@cluster0.ay1oe.mongodb.net/dienstplan?retryWrites=true&w=majority&appName=Cluster0";

// User Schema
const userSchema = new mongoose.Schema({
    name: String,
    pin: String,
    rolle: String,
    aktiv: Boolean
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB verbunden');

        // PIN hashen
        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash('1234', salt);

        // Admin erstellen
        const admin = new User({
            name: 'Admin',
            pin: hashedPin,
            rolle: 'admin',
            aktiv: true
        });

        await admin.save();
        console.log('Admin erstellt!');
        process.exit(0);
    } catch (error) {
        console.error('Fehler:', error);
        process.exit(1);
    }
}

createAdmin();
