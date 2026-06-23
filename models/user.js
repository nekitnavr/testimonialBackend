const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    userId: {
        type: Number,
        unique: true,
        required: true
    },
    email: {
        type: String, 
        unique: true,
        required: true
    },
    password: {
        type: String, 
        required: true
    },
    businessName: {
        type: String, 
        required: true
    },
    role: {
        type: String, 
        enum: ['owner', 'staff'],
        default: 'owner',
        required: false
    },
    isActive: {
        type: Boolean,
        default: true,
        required: false
    },
    
}, { 
    timestamps: true 
})

const User = mongoose.model('User', userSchema)
module.exports = User