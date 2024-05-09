const mongoose = require('mongoose');

const addressSchema = mongoose.Schema({
    user_id:{
        type:mongoose.SchemaTypes.ObjectId,
        required:true
    },
    address:
    [ 
        {
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
                    default:false
                },
                is_Work:{
                    type:Boolean,
                    default:false
                },
                
        }
    ]
     
});


module.exports = mongoose.model('Address',addressSchema);