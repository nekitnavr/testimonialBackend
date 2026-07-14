const mongoose = require('mongoose')
const { roles } = require('../lib/constants')

const userSchema = new mongoose.Schema(
    {
        userId: {
            type: Number,
            unique: true,
            required: true,
        },
        email: {
            type: String,
            unique: true,
            required: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        businessName: {
            type: String,
            required: true,
            maxlength: [200, 'businessName must be at most 200 characters'],
        },
        role: {
            type: String,
            enum: roles,
            default: 'owner',
            required: false,
        },
        isActive: {
            type: Boolean,
            default: true,
            required: false,
        },
    },
    {
        timestamps: true,
    },
)

const User = mongoose.model('User', userSchema)
module.exports = User
