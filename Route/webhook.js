// Initialize express router
const express = require('express');
const {
    cardAuthorization
} = require('../Controller/webhook');

const router = express.Router();

// webhook routes
router
    .route('/sudo')
    .post(cardAuthorization)
module.exports = router;