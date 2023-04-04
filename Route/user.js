// Initialize express router
const express = require('express');
const {
    getUsers,
    getUser
} = require('../Controller/user');

// const User = require('../Model/User');
const router = express.Router();

// user routes
router
    .route('/')
    .get(getUsers)
router
    .route('/:id')
    .get(getUser)
module.exports = router;