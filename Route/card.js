// Initialize express router
const express = require('express');
const {
    getCards,
    getCard,
    getUserCard,
    getExchangeRate,
    fundCard,
    withdrawFund,
    createCard,
    displayCardNumber,
    displayCardCvv,
    displayCardPin,
    simulateTransaction,
    updateCard
} = require('../Controller/card');

const router = express.Router({ mergeParams: true });

// card routes
router
    .route('/')
    .get(getCards)
    .post(createCard);
router
    .route('/fund-card')
    .post(fundCard);
router
    .route('/withdraw-fund')
    .post(withdrawFund);
router
    .route('/simulate')
    .post(simulateTransaction);
router
router
    .route('/rate')
    .get(getExchangeRate);
router
    .route('/:id')
    .get(getCard)
    .put(updateCard);
router
    .route('/user/:user')
    .get(getUserCard);
router
    .route('/:card/number')
    .get(displayCardNumber);
router
    .route('/:card/cvv')
    .get(displayCardCvv);
router
    .route('/:card/defaultPin')
    .get(displayCardPin);

module.exports = router;