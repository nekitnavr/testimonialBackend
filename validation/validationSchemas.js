const { Error } = require('mongoose')
const { roles, statuses, allowedChannels, allowedFieldsToSortBy } = require('../lib/constants')
const User = require('../models/user')
const { customerEmailRule, customerPhoneRule, ratingRule, consentGivenRule, videoUrlRule, textRule } = require('./validationRules')

const checkEmailExists = async (email) => {
    const isDuplicated = await User.exists({ email: email })
    if (isDuplicated) throw new Error('User with this email already exists')
}

const checkStatus = (status) => {
    if (!statuses.includes(status)) {
        throw new Error('Status invalid')
    }
    return true
}

const checkRole = (role) => {
    if (!roles.includes(role)) {
        throw new Error('Role does not exist')
    }
    return true
}

const checkChannels = (channels) => {
    const allAllowed = channels.every((channel) => allowedChannels.includes(channel))
    if (!allAllowed) {
        throw new Error('Some channels are invalid')
    }
    return true
}

const checkSortBy = (sortByField) => {
    if (!allowedFieldsToSortBy.includes(sortByField)) {
        throw new Error(`Can't sort by this field`)
    }
    return true
}

const removeRepeatingChannels = (channels) => {
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
            options: checkEmailExists,
        },
    },
    password: {
        trim: true,
        notEmpty: { errorMessage: 'Password must not be empty' },
    },
    businessName: {
        trim: true,
        notEmpty: { errorMessage: 'Business name must not be empty' },
    },
    role: {
        optional: true,
        trim: true,
        custom: {
            options: checkRole,
        },
    },
}

module.exports.loginSchema = {
    email: { trim: true, notEmpty: { errorMessage: 'Email required' } },
    password: { trim: true, notEmpty: { errorMessage: 'Password required' } },
}

module.exports.createTestimonialSchema = {
    customerName: {
        trim: true,
        notEmpty: { errorMessage: 'Customer name must not be empty' },
    },
    customerEmail: customerEmailRule,
    customerPhone: customerPhoneRule,
    videoUrl: videoUrlRule,
    rating: ratingRule,
    text: textRule,
    consentGiven: consentGivenRule,
}

module.exports.getTestimonialsSchema = {
    status: {
        optional: true,
        trim: true,
        custom: {
            options: checkStatus,
        },
    },
    page: {
        optional: true,
        isInt: {
            options: {
                min: 1,
            },
            errorMessage: 'Page must be greater than 0',
        },
    },
    limit: {
        optional: true,
        isInt: {
            options: {
                min: 1,
            },
            errorMessage: 'Limit must be greater than 0',
        },
    },
    sort: {
        optional: true,
        trim: true,
        notEmpty: { errorMessage: 'Sort must not be empty' },
        custom: {
            options: checkSortBy,
            errorMessage: `Allowed fields to sort by: ${allowedFieldsToSortBy.join(', ')}`,
        },
    },
}

module.exports.updateTestimonialSchema = {
    customerName: {
        optional: true,
        trim: true,
        notEmpty: { errorMessage: 'Customer name must not be empty' },
    },
    customerEmail: customerEmailRule,
    customerPhone: customerPhoneRule,
    videoUrl: videoUrlRule,
    rating: ratingRule,
    text: textRule,
    consentGiven: consentGivenRule,
}

module.exports.updateStatusSchema = {
    status: {
        trim: true,
        custom: {
            options: checkStatus,
        },
    },
}

module.exports.shareTestimonialSchema = {
    channels: {
        isArray: {
            options: {
                min: 1,
            },
            errorMessage: 'Channels must be an array of at least one channel',
        },
        custom: {
            options: checkChannels,
            errorMessage: `Allowed channels: ${allowedChannels.join(', ')}.`,
        },
        customSanitizer: {
            options: removeRepeatingChannels,
        },
    },
}

module.exports.getAnalyticsSchema = {
    startDate: {
        optional: true,
        trim: true,
        isISO8601: {
            errorMessage: 'startDate must be a valid date (ISO 8601)',
        },
    },
    endDate: {
        optional: true,
        trim: true,
        isISO8601: {
            errorMessage: 'endDate must be a valid date (ISO 8601)',
        },
    },
}

module.exports.upsertTestimonialSettingsSchema = {
    isEnabled: {
        optional: true,
        isBoolean: {
            errorMessage: 'isEnabled must be boolean',
        },
    },
    defaultVideoLength: {
        optional: true,
        isInt: {
            options: {
                min: 1,
            },
            errorMessage: 'defaultVideoLength must be an integer greater than 0',
        },
    },
    videoLengthOptions: {
        optional: true,
        isArray: {
            options: { min: 1 },
            errorMessage: 'videoLengthOptions must be an array with at least one element',
        },
    },
    'videoLengthOptions.*': {
        isInt: {
            errorMessage: 'Each videoLengthOptions value must be an integer',
        },
    },
    questionnaire: {
        optional: true,
        isArray: {
            options: { min: 1 },
            errorMessage: 'questionnaire must be an array with at least one element',
        },
    },
    'questionnaire.*': {
        optional: true,
        isString: { errorMessage: 'Each questionnaire value must be a string' },
    },
    sendingOptions: {
        optional: true,
        isArray: {
            options: { min: 1 },
            errorMessage: 'sendingOptions must be an array with at least one element',
        },
        checkChannels: {
            custom: checkChannels,
            errorMessage: `Allowed sendingOptions: ${allowedChannels.join(', ')}.`,
        },
        removeRepeatingChannels: {
            customSanitizer: removeRepeatingChannels,
        },
    },
    thankYouMessage: {
        optional: true,
        trim: true,
        isString: { errorMessage: 'thankYouMessage must be a string' },
    },
    contactConsent: {
        optional: true,
        isObject: {
            strict: true,
            errorMessage: 'contactConsent must be an object',
        },
    },
    'contactConsent.enabled': {
        optional: true,
        isBoolean: { errorMessage: 'contactConsent.enabled must be a boolean' },
    },
    'contactConsent.text': {
        optional: true,
        trim: true,
        isString: { errorMessage: 'contactConsent.text must be a string' },
    },
}
