const ErrorResponse = require('../Utils/errorResponse');
const asyncHandler = require('../Middleware/async');
const sendRequest = require('../Utils/sendRequest');
const User = require('../Model/User');
const Card = require('../Model/Card');

exports.getCards = asyncHandler(async (req, res, next) => {
    const cards = await Card.find();
    res.status(200).json({
        status: "success",
        count: cards.length,
        message: 'Cards fetched successfully',
        data: cards
    });
});

// Get a Single
exports.getCard = asyncHandler(async (req, res, next) => {
    const card = await Card.findById(req.params.id);

    if (card == null) {
        res.send({
            status: "error",
            message: "Card not found!",
        });
        return next(new ErrorResponse("Card not found!", 404));
        // console.log('card not found - 404');
    } else{
        const sudoCard = await sendRequest('sudo', '/cards/'+card.cardId, 'get');
        const cardToken = await sendRequest('sudo', '/cards/'+card.cardId+'/token', 'get');
        // console.log('====================================');
        // console.log(cardToken);
        // console.log('====================================');
        res.status(200).json({
            status: "success",
            message: 'Card fetched successfully',
            data: {
                card,
                customer: sudoCard.data.customer,
                account: sudoCard.data.account,
                token: cardToken.data.token // The token will be used to reveal full card details
            }
        })
    }
});

exports.getExchangeRate = asyncHandler(async (req, res, next) => {
    const rate = await sendRequest('sudo', '/accounts/transfer/rate/USDNGN', 'get')
    // console.log('====================================');
    // console.log(rate);
    // console.log('====================================');
    if(rate.statusCode == 200){
        res.status(200).send({
            status: "success",
            message: 'Exchange rate fetched successfully!',
            data: rate.data
        });
    }
});

exports.fundCard = asyncHandler(async (req, res, next) => {
    const card = await Card.findById(req.body.card);
    const amount = parseInt(req.body.amount);
    if (card == null) {
        res.send({
            status: "error",
            message: "Card not found!",
        });
        return next(new ErrorResponse("Card not found!", 404));
        // console.log('card not found - 404');
    } else{
        const sudoCard = await sendRequest('sudo', '/cards/'+card.cardId, 'get');
        const data = {
            "debitAccountId": process.env.DEBIT_ACCOUNT,
            "creditAccountId": sudoCard.data.account._id,
            "amount": amount,
            "paymentReference": "balabulu"
        };
        const fund = await sendRequest('sudo', '/accounts/transfer', 'post', data);
        console.log('====================================');
        console.log(fund);
        console.log('====================================');
        if(fund.statusCode == "200"){
            res.status(200).json({
                status: "success",
                message: 'Card funded successfully',
                data: { }
            })
        }
    }
})

exports.getUserCard = asyncHandler(async (req, res, next) => {
    const card = await Card.findOne({ user: req.params.user });

    if (card == null) {
        res.send({
            status: "error",
            message: "User have no card issued!",
        });
        return next(new ErrorResponse("User have no card issued!", 404));
    }

    const cardToken = await sendRequest('sudo', '/cards/'+card.cardId+'/token', 'get');
    // console.log('====================================');
    // console.log(cardToken);
    // console.log('====================================');
    res.status(200).json({
        status: "success",
        message: 'Card fetched successfully',
        data: {
            card,
            token: cardToken.data.token
        }
    })
});

exports.createCard = asyncHandler(async (req, res, next) => {
    // Check if user exists
    const user = await User.findById(req.body.user);
    if (!user._id) {
        return next(new ErrorResponse("User not found!", 404));
    }
    // console.log(user);
    const name = user.firstName + ' ' + user.lastName

    // Create Card Holder | Card holder need to be created first
    const customer = await sendRequest('sudo', '/customers', 'post', {
        type: 'individual',
        name: name,
        phoneNumber: user.phone,
        emailAddress: user.email,
        status: "active",
        individual: {
            identity: {
                type: "BVN",
                number: "10123456789" 
            },
            firstName: user.firstName,
            lastName: user.lastName
        },
        billingAddress: {
            line1: "4 Barnawa Close",
            line2: "Off Challawa Crescent",
            city: "Barnawa",
            state: "Kaduna",
            country: "NG",
            postalCode: "800001"
        }
    });
    // console.log(customer);
    if (customer.statusCode != 200) {
        return next(new ErrorResponse("Unable to Create customer", 400));
    }

    // This will update the card holder's 
    const update = await sendRequest('sudo', '/customers/'+customer.data._id, 'put', {
        type: 'individual',
        name: name,
        phoneNumber: user.phone,
        emailAddress: user.email,
        status: "active",
        individual: {
            firstName: user.firstName,
            lastName: user.lastName
        }
    });
    console.log('====================================');
    console.log(update);
    console.log('====================================');

    // Create and Map Card to Customer with default funding source
    const card = await sendRequest('sudo', '/cards', 'post', {
        customerId: update.data._id, // Card Holder's ID from Sudo
        fundingSourceId: process.env.DEFAULT_FUNDING_SOURCE, // Funding Source ID from env file
        debitAccountId: process.env.DEBIT_ACCOUNT, // Funding Source ID from env file
        type: "virtual",
        currency: "NGN",
        issuerCountry: "NGA",
        sendPINSMS: true,
        status: "active",
        brand: "Verve",
        metadata: {},
        spendingControls: {
            channels: {
                atm: true,
                pos: true,
                web: true,
                mobile: true
            },
            allowedCategories: [],
            blockedCategories: [],
            spendingLimits: [{
                amount: 100000,
                interval: "daily"
            }]
        }
    });
    console.log(card);
    if (card.statusCode != 200) {
        return next(new ErrorResponse("Request Error, Unable to create card", 400));
    }

    // Save Card to DB
    const result = await Card.create({
        user: req.body.user,
        cardId: card.data._id,
        customerId: update.data._id,
        pan: card.data.maskedPan,
        expiry: card.data.expiryMonth + '/' + card.data.expiryYear,
        brand: card.data.brand,
        channels: {
            atm: true,
            pos: true,
            web: true,
            mobile: true
        }
    });

    res.status(201).json({
        status: "success",
        message: 'Card created successfully',
        data: result
    });
});

exports.displayCardNumber = asyncHandler(async (req, res, next) => {
    const card = await Card.findById(req.params.card);
    const cardNumber = await sendRequest('sudo-vault', '/cards/'+card.cardId+'/secure-data/number', 'get')
    // console.log('====================================');
    // console.log(card);
    // console.log('====================================');
    if(cardNumber.statusCode == 200){
        res.status(200).send({
            status: "success",
            message: 'Request successful.',
            data: cardNumber.data
        });
    }
});

exports.displayCardCvv = asyncHandler(async (req, res, next) => {
    const card = await Card.findById(req.params.card);
    const cardCvv = await sendRequest('sudo-vault', '/cards/'+card.cardId+'/secure-data/cvv2', 'get')
    // console.log('====================================');
    // console.log(card);
    // console.log('====================================');
    if(cardCvv.statusCode == 200){
        res.status(200).send({
            status: "success",
            message: 'Request successful.',
            data: cardCvv.data
        });
    }
});

exports.displayCardPin = asyncHandler(async (req, res, next) => {
    const card = await Card.findById(req.params.card);
    const cardPin = await sendRequest('sudo-vault', '/cards/'+card.cardId+'/secure-data/defaultPin', 'get')
    // console.log('====================================');
    // console.log(card);
    // console.log('====================================');
    if(cardPin.statusCode == 200){
        res.status(200).send({
            status: "success",
            message: 'Request successful.',
            data: cardPin.data
        });
    }
});

exports.simulateTransaction = asyncHandler(async (req, res, next) => {
    const card = await Card.findById(req.body.card);
    const trxnType = req.body.type;

    if (!card._id) {
        return next(new ErrorResponse("Card not found!", 404));
    }
    const simulate = await sendRequest('sudo', '/cards/simulator/authorization', 'post', {
        channel: req.body.channel,
        type: trxnType.toLocaleLowerCase(),
        amount: parseInt(req.body.amount),
        cardId: card.cardId,
        currency: "NGN",
        merchant: {
            category: "7399",
            merchantId: "000000001",
            name: "Sudo Inc",
            city: "Zing",
            state: "TR",
            country: "NG"
        }
    });
    res.send(simulate);
});

exports.updateCard = asyncHandler(async (req, res, next) => {
    const card = await Card.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        status: "success",
        data: card
    });
});