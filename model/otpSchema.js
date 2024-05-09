const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    userEmail:{
        type:String,
        require:true
    },
    code:{
        type:Number,
        required:true
    },
    expiresAt:{
        type:Date,
        expires:0
    }

})


module.exports = new mongoose.model("otps",otpSchema)