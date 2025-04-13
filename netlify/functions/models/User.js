const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    pin: {
        type: String,
        required: true
    },
    rolle: {
        type: String,
        enum: ['admin', 'mitarbeiter'],
        default: 'mitarbeiter'
    },
    aktiv: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('User', userSchema);
