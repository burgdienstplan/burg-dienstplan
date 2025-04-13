const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://Steindorfer:Ratzendorf55@cluster0.ay1oe.mongodb.net/dienstplan?retryWrites=true&w=majority&appName=Cluster0";

async function checkAll() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB verbunden');

        // Alle Collections anzeigen
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Vorhandene Collections:', collections.map(c => c.name));

        // Für jede Collection den Inhalt anzeigen
        for (const collection of collections) {
            console.log(`\nInhalt von ${collection.name}:`);
            const docs = await mongoose.connection.db.collection(collection.name).find({}).toArray();
            console.log(JSON.stringify(docs, null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error('Fehler:', error);
        process.exit(1);
    }
}

checkAll();
