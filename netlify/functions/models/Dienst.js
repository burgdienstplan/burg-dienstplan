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
    position: {
        type: String,
        enum: ['shop_eintritt', 'shop_museum', 'eintritt'],
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

// Unique Index für {datum, position}
dienstSchema.index({ datum: 1, position: 1 }, { unique: true });

module.exports = mongoose.model('Dienst', dienstSchema);
