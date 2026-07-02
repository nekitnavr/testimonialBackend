const { Error } = require('mongoose')
const { roles, statuses, allowedChannels } = require('../lib/constants')
const User = require('../models/user')
const {customerEmailRule, customerPhoneRule, ratingRule, consentGivenRule} = require('./validationRules')

const checkEmail = async email=>{
    const isDuplicated = await User.exists({email: email})
    if (isDuplicated) throw new Error('User with this email already exists')
}

const checkStatus = status=>{
    if(!statuses.includes(status)){
        throw new Error('Status invalid');
    }
    return true
}

const checkRole = role=>{
    if(!roles.includes(role)){
        throw new Error('Role does not exist');
    }
    return true
}

const checkChannels = channels=>{
    const allAllowed = channels.every(channel => allowedChannels.includes(channel))
    if (!allAllowed) {
        throw new Error('Some channels are invalid')
    }
    return true
}

const removeRepeatingChannels = channels=>{
    channels = [...new Set(channels)]
    return channels
}

module.exports.createUserSchema = {
    email: {
        trim: true,
        isEmail: {
            errorMessage: 'Invalid email',
        },
        custom: {
            options: checkEmail
        }
    },
    password: { 
        trim: true,
        notEmpty: { errorMessage: 'Password must not be empty' } 
    },
    businessName: { 
        trim: true,
        notEmpty: { errorMessage: 'Business name must not be empty' } 
    },
    role: {
        trim: true,
        custom: {
            options: checkRole
        }
    },
}

module.exports.loginSchema = {
    email:{ trim: true, notEmpty: {errorMessage: 'Email required'} },
    password: { trim: true, notEmpty: {errorMessage: 'Password required'}}
}

module.exports.createTestimonialSchema = {
    customerName: {         
        trim: true,
        notEmpty: { errorMessage: 'Customer name must not be empty' },   
    },
    customerEmail: customerEmailRule,
    customerPhone: customerPhoneRule,
    rating: ratingRule,
    consentGiven: consentGivenRule
}

module.exports.getTestimonialsSchema = {
    status: {
        optional: true,
        trim: true,
        custom: {
            options: checkStatus
        }
    },
    page:{
        optional: true,
        isInt: {
            options: {
                min: 1
            },
            errorMessage: 'Page must be greater than 0'
        }
    },
    limit:{
        optional: true,
        isInt: {
            options: {
                min: 1
            },
            errorMessage: 'Limit must be greater than 0'
        }
    }
}

module.exports.updateTestimonialSchema = {
    customerEmail: customerEmailRule,
    customerPhone: customerPhoneRule,
    rating: ratingRule,
    consentGiven: consentGivenRule
}

module.exports.updateStatusSchema = {
    status: {
        trim: true,
        custom: {
            options: checkStatus
        }
    }
}

module.exports.shareTestimonialSchema = {
    channels: {
        isArray: {
            options:{
                min: 1
            },
            errorMessage: 'Channels must be an array of at least one channel'
        },
        custom: {
            options: checkChannels
        },
        customSanitizer: {
            options: removeRepeatingChannels
        }
    }
}