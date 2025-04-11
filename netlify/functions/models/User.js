const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    benutzername: {
        type: String,
        required: true,
        unique: true
    },
    passwort: {
        type: String,
        required: true
    },
    rolle: {
        type: String,
        enum: ['admin', 'mitarbeiter', 'hausmeister'],
        required: true
    }
});

module.exports = mongoose.model('User', userSchema);
