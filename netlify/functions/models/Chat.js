const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    von: {
        type: String,
        required: true
    },
    nachricht: {
        type: String,
        required: true
    },
    zeitstempel: {
        type: Date,
        default: Date.now
    }
});

// Index für schnelles Sortieren nach Zeitstempel
chatSchema.index({ zeitstempel: -1 });

module.exports = mongoose.model('Chat', chatSchema);
