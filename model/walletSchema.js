const mongoose = require('mongoose');

const walletSchema = mongoose.Schema({
    userId : {
        type : mongoose.SchemaTypes.ObjectId,
        required : true
    },
    walletAmount :{
        type : Number,
        default : 0
    },
    transactionHistory : [{
        amount : {
            type : Number,
            default: 0 
        },
        PaymentType:{ 
            type:String,
            default:null
        },
        date:{
            type:Date,
            default:Date.now
        }
    }]
})

module.exports = mongoose.model('Wallet',walletSchema)