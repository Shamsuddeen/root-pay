const ErrorResponse = require('../Utils/errorResponse');
const asyncHandler = require('../Middleware/async');
const User = require('../Model/User');

exports.getUsers = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults);
});

exports.getUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id, (err, result) => {
        if (!result) {
            return next(new ErrorResponse("User not foud!", 404));
        }
        res.status(200).json({
            success: true,
            status: "success",
            data: result
        })
    })
});

exports.updateUser = asyncHandler(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        status: "success",
        data: user
    });
});