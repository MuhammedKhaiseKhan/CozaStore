const mongoose = require('mongoose');
const categorySchema = require('./categorySchema');


const productSchema = new mongoose.Schema({
    productName:{
        type:String,
        required:true
    },
    brand:{
        type:String,
        required:true
    },
    size:{
        type:String,
        required:true
    },
    color:{
        type:String,
        required:true
    },
    category:{
        type:mongoose.Schema.ObjectId,
        ref:"Categories",
        required:true
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
    image:[{
        type:String,
        required:true
    }],
    status:{
        type:Boolean,
        default:true
    },
    inStock:{
        type:Number,
        required:true
    },
    popularProduct:{
        type:Boolean,
        default:false
    },
    applicableCoupons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
    }],
    isDeleted:{
        type:Boolean,
        default:false
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    offers: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer'
    }]
});


module.exports = mongoose.model('Products',productSchema);



// const mongoose = require('mongoose');
// const categorySchema = require('./categorySchema');


// const productSchema = new mongoose.Schema({
//     productName:{
//         type:String,
//         required:true
//     },
//     brand:{
//         type:String,
//         required:true
//     },
//     size:{
//         type:String,
//         required:true
//     },
//     color:{
//         type:String,
//         required:true
//     },
//     category:{
//         type:mongoose.Schema.ObjectId,
//         ref:"Categories",
//         required:true
//     },
//     description:{
//         type:String,
//         required:true
//     },
//     price:{
//         type:Number,
//         required:true
//     },
//     discountPrice:{
//         type:Number,
//         required:true
//     },
//     discount:{
//         type:Number,
//         required:true
//     },
//     image:[{
//         type:String,
//         required:true
//     }],
//     status:{
//         type:Boolean,
//         default:true
//     },
//     inStock:{
//         type:Number,
//         required:true
//     },
//     popularProduct:{
//         type:Boolean,
//         default:false
//     },
//     applicableCoupons: [{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Coupon'
//     }],
//     productOffer:{
//         type:Number
//     },
//     categoryOffer:{
//         type:Number
//     },
//     maxRedeemableAmount:{
//         type:Number
//     },
//     isDeleted:{
//         type:Boolean,
//         default:false
//     },
//     createdAt:{
//         type:Date,
//         default:Date.now
//     },
//     offers: [{ 
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Offer'
//     }]
// });


// module.exports = mongoose.model('Products',productSchema);