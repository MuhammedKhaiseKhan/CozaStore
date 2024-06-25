const mongoose = require('mongoose')

const offerSchema = mongoose.Schema({
    offer: {
        type: String,
        required: true
    },
    offerType: {
        type: String,
        required: true
    },
    Pname: {
        type: String,

    },
    category: {
        type: String,
        ref: "Categories",

    },
    discount: {
        type: Number,
        required: true

    },
    expiredDate: {
        type: Date,
        required: true
    },
    maxRedeemableAmount: {
        type: Number,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    }
})

module.exports = mongoose.model('Offer', offerSchema)