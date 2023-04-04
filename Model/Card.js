const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
    user: {
        type: mongoose.ObjectId,
        ref: 'User',
        required: true
    },
    cardId: { // Card ID from Sudo (Issuer)
        type: String,
        required: true
    },
    customerId: { // Card Holder's ID from Sudo
        type: String,
        required: true,
        unique: true
    },
    pan: {
        type: String,
        required: true,
        unique: true
    },
    expiry: String,
    brand: String,
    active: {
        type: Boolean,
        required: true,
        default: true
    },
    channels: [{
        atm: {
            type: Boolean,
            required: true,
            default: true
        },
        pos: {
            type: Boolean,
            required: true,
            default: true
        },
        web: {
            type: Boolean,
            required: true,
            default: true
        },
        mobile: {
            type: Boolean,
            required: true,
            default: true
        }
    }],
    create_date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('cards', cardSchema);