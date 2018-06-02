var mongoose = require('mongoose');

var User = mongoose.model("User", {
    id: {
        type: String,
        required: true,
        minlength: 1,
        trim: true, //removes leading and trailing whitespace

    },
    userName:{
        type: String,
        trim: true,
        default: 'anon'
    },
    role:{
        type: String,
        default: null
    },
    socketId: {
        type: String,
        default: null
    },
    roomId:{
        type: String,
        default: null
    },
    hash:{
        type: String,
        default: null
    }
});
    
module.exports = {User};