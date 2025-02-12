
const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    userId:{
        type:mongoose.SchemaTypes.ObjectId,
        required:true,
        ref: 'User'
    },
    orderID: {
        type: String,
        unique: true,
        required: true
    },
    orderItems : [{
        productId : {
            type : mongoose.SchemaTypes.ObjectId,
            required : true
        },
        quantity : {
            type:Number,
            required:true,
            default:1
        },
        productName:{
            type:String,
            required:true
        },
        brand:{
            type:String,
            required:true
        },
        category:{
            type:String,
            required:true,
            ref: 'Categories'
        },
        description:{
            type:String,
            required:true
        },
        price:{
            type:Number,
            required:true
        },
        discountPrice:{
            type:Number,
            required:true
        },
        discount:{
            type:Number,
            required:true
        },
        offerId:{
            type:mongoose.SchemaTypes.ObjectId
        },
        image:[{
            type:String,
            required:true
        }]
    }],
    paymentMethod:{
        type:String,
        required:true
    },
    razorpayOrderId:{
        type:String,
        required:false
    },
    orderDate:{
        type:Date,
        default:Date.now()
    },
    address:{
        Name:{
            type:String,
            required:true
        },
        email:{
            type:String,
            required:true
        },
        Mobile:{
            type:Number,
            required:true
        },
        PIN:{
            type:Number,
            required:true
        },
        Locality:{
            type:String,
            required:true
        },
        address:{
            type:String,
            required:true
        },
        city:{
            type:String,
            required:true
        },
        state:{
            type:String,
            required:true
        },
        is_Home:{
            type:Boolean,
            required:false
        },
        is_Work:{
            type:Boolean,
            required:false
        },
    },
    orderStatus:{
        type:String,
        default:"pending",
        required:true
    },
    returnReason:{
        type:String
    },
    cancelReason:{
        type:String
    },
    totalAmount:{
        type:Number
    },
    couponId:{
        type:mongoose.SchemaTypes.ObjectId
    },
    couponDiscount: { 
        type: Number,
        default: 0
    },
    offerDiscount:{
        type: Number,
        default: 0
    },
    
});

module.exports = mongoose.model('Order', orderSchema);

