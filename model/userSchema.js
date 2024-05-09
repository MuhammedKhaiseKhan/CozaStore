const mongoose = require('mongoose');


const userSchema = mongoose.Schema({
    fname:{
        type:String,
        required:true
    },
    sname:{
        type:String,
        required:true
    },
    username:{
        type:String,
        require:true
    },
    email:{
        type:String,
        required:true
    },
    is_verified:{
        type:Boolean,
        default:false
    },
    number:{
        type:Number,
        require:true
    },
    createdAt:{
        type:Date,
        default:Date.now()
    },
    password:{
        type:String,
        require:true
    }
});

module.exports = mongoose.model('User',userSchema);