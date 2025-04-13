const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://Steindorfer:Ratzendorf55@cluster0.ay1oe.mongodb.net/dienstplan?retryWrites=true&w=majority&appName=Cluster0";

const userSchema = new mongoose.Schema({
    name: String,
    pin: String,
    rolle: String,
    aktiv: Boolean
});

const User = mongoose.model('User', userSchema);

async function checkUser() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB verbunden');

        const users = await User.find();
        console.log('Gefundene Benutzer:', users);
        process.exit(0);
    } catch (error) {
        console.error('Fehler:', error);
        process.exit(1);
    }
}

checkUser();
