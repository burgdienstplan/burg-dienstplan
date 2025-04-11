const mongoose = require('mongoose');

const dienstSchema = new mongoose.Schema({
    mitarbeiterId: {
        type: String,
        required: true
    },
    datum: {
        type: String,
        required: true
    },
    startZeit: {
        type: String,
        required: true
    },
    endZeit: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['geplant', 'angefragt', 'genehmigt', 'abgelehnt'],
        default: 'geplant'
    },
    erstelltVon: {
        type: String,
        required: true
    },
    erstelltAm: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Dienst', dienstSchema);
