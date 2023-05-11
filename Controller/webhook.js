const ErrorResponse = require('../Utils/errorResponse');
const asyncHandler = require('../Middleware/async');
const Transaction = require('../Model/Transaction');
const Card = require('../Model/Card');

exports.cardAuthorization = asyncHandler(async (req, res, next) => {
    console.log('====================================');
    console.log(req.body);
    console.log('====================================');
    const card = await Card.findOne({
        cardId: req.body.data.object.card._id
    });

    if (!card._id) {
        return next(new ErrorResponse("Card not found!", 404));
    }
    // console.log('====================================');
    // console.log(req.body.data);
    // console.log('====================================');
    if (req.body.type == "authorization.request") {
        const amount = req.body.data.object.amount;
        const channel = req.body.data.object.transactionMetadata.channel;
        const balance = card.balance;
        /*
         Check if the card status
         If the card statcus is active
         Check it Transaction Channel is allowed on the card
        */
        if (card.active === true) {
            card.channels.forEach(async(item) => {
                // console.log(item[channel]);
                if (item[channel] === true) {
                    // Check if card balance is sufficient
                    if (balance >= amount) {
                        // Updated Card and Send response
                        const updateFields = {
                            "balance": balance
                        };
                        await Card.findByIdAndUpdate(card._id, updateFields, {
                            new: true,
                            runValidators: true
                        });

                        await Transaction.create({
                            user: card.user,
                            cardId: card.cardId,
                            cardPan: card.pan,
                            amount: amount,
                            channel: channel+" "+req.body.data.object.transactionMetadata.type+" @ "+req.body.data.object.merchant.name
                        });

                        res.json({
                            "statusCode": 200,
                            "responseCode": "00",
                        })
                    } else {
                        res.json({
                            "statusCode": 400,
                            "responseCode": "51", // Insufficient fund
                        })
                    }
                } else {
                    // return next(new ErrorResponse("Payment Channel not allowed!", 400));
                    res.json({
                        "statusCode": 400,
                        "responseCode": "62", // Restricted card
                    })
                }
            })
        } else {
            // Card is OFF
            // return next(new ErrorResponse("Card is OFF!", 400));
            res.json({
                "statusCode": 400,
                "responseCode": "62", // Restricted card
            })
        }
    }
});