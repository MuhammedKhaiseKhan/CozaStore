const mongoose = require('mongoose');


const userSchema = mongoose.Schema({
    fname:{
        type:String,
        required:true
    },
    sname:{
        type:String,
        required:false,
    },
    username:{
        type:String,
        require:false
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
        require:false,
        sparse:true,
        default:null,
    },
    googleId:{
        type:String,
        unique:true
    },
    createdAt:{
        type:Date,
        default:Date.now()
    },
    password:{
        type:String,
        require:false
    }
});

module.exports = mongoose.model('User',userSchema);