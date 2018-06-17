var mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const {ObjectID} = require('mongodb');

var UserSchema = new mongoose.Schema({
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
    record:{
        wins:{
            type: Number,
            default: 0
        },
        losses:{
            type: Number,
            default: 0
        },
        ties:{
            types: Number,
            default: 0
        }
    }
})
    
UserSchema.methods.generateAuthToken = function(){
    var user = this;
    var token = jwt.sign({_id: user._id.toHexString()}, process.env.JWT_SECRET).toString();
    return token;
}

UserSchema.statics.findByToken = function(token){   //model methods get called with model as this binded
    var User = this;
    var decoded;

    try{
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    }catch(e){
        return Promise.reject();
    }

    return User.findById({
        '_id': decoded._id
    })
}

var User = mongoose.model("User", UserSchema)
module.exports = {User};