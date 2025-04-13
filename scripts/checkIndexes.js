const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://Steindorfer:Ratzendorf55@cluster0.ay1oe.mongodb.net/dienstplan?retryWrites=true&w=majority&appName=Cluster0";

async function checkIndexes() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB verbunden');

        const User = mongoose.model('User', new mongoose.Schema({}));
        
        // Alle Indizes anzeigen
        const indexes = await User.collection.indexes();
        console.log('Vorhandene Indizes:', indexes);

        // Alle Indizes löschen (außer _id)
        await User.collection.dropIndexes();
        console.log('Alle Indizes gelöscht (außer _id)');

        process.exit(0);
    } catch (error) {
        console.error('Fehler:', error);
        process.exit(1);
    }
}

checkIndexes();
