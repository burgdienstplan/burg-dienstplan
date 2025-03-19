const mongoose = require('mongoose');

exports.handler = async (event, context) => {
    try {
        console.log('Umgebungsvariablen:');
        console.log('MONGODB_URI vorhanden:', !!process.env.MONGODB_URI);
        if (process.env.MONGODB_URI) {
            // Zeige nur den Hostnamen und Datenbanknamen, keine Zugangsdaten
            const uri = process.env.MONGODB_URI;
            const sanitizedUri = uri.replace(/\/\/[^@]+@/, '//***:***@');
            console.log('MongoDB URI (maskiert):', sanitizedUri);
        }

        console.log('Versuche Verbindung zu MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('MongoDB Verbindung erfolgreich!');
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Verbindung zu MongoDB erfolgreich',
                connected: true
            })
        };
    } catch (error) {
        console.error('Fehler:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Fehler bei der MongoDB-Verbindung',
                error: error.message,
                stack: error.stack
            })
        };
    } finally {
        // Verbindung schließen
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
};
