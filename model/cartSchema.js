const mongoose = require('mongoose');

const cartSchema =  mongoose.Schema({
    userId:{
        type : mongoose.SchemaTypes.ObjectId,
        required : true
    },
    cartItems:[
        {
            productId:{
                type : mongoose.SchemaTypes.ObjectId,
                ref:'Products',
                required : true
            },
            quantity:{
                type : Number,
                default : 1
            }
        }
    ]
});

module.exports = mongoose.model("cart",cartSchema);