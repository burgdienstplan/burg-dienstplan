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

module.exports = mongoose.model('Chat', chatSchema);
