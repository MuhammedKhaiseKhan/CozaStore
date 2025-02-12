const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String, 
        required: true
    },
    is_delete: {
        type: Boolean,
        required: true,
        default:false
    }
});

module.exports = mongoose.model("Categories", categorySchema);
