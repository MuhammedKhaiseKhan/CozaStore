const mongoose = require('mongoose')

const wishlistSchema = mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    wishlistItems: [{
        type: mongoose.Types.ObjectId,
        required: true
    }]

})

module.exports = mongoose.model('Wishlist', wishlistSchema)