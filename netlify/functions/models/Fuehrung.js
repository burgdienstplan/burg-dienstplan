const mongoose = require('mongoose');

const fuehrungSchema = new mongoose.Schema({
    datum: {
        type: String,
        required: true
    },
    uhrzeit: {
        type: String,
        required: true
    },
    gruppenname: {
        type: String,
        required: true
    },
    personenanzahl: {
        type: Number,
        required: true
    },
    sprache: {
        type: String,
        required: true
    },
    fuehrerId: {
        type: String,
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

module.exports = mongoose.model('Fuehrung', fuehrungSchema);
