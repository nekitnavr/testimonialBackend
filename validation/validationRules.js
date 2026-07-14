module.exports.customerEmailRule = {
    optional: true,
    trim: true,
    isEmail: {
        errorMessage: 'Invalid email',
    },
    normalizeEmail: true,
    isLength: {
        max: 254,
        errorMessage: 'customerEmail is too long',
    },
}

module.exports.customerPhoneRule = {
    optional: true,
    isLength: {
        min: 9,
        max: 20,
        errorMessage: 'Phone numbers must be at least 9 and at most 20 digits',
    },
}

module.exports.ratingRule = {
    optional: true,
    isInt: {
        options: {
            min: 1,
            max: 5,
        },
        errorMessage: 'Rating must be an integer 1 thorough 5',
    },
}

module.exports.consentGivenRule = {
    optional: true,
    isBoolean: { errorMessage: 'Consent given must be boolean' },
}

module.exports.videoUrlRule = {
    optional: true,
    trim: true,
    isURL: { errorMessage: 'videoUrl must be a valid URL' },
}

module.exports.textRule = {
    optional: true,
    trim: true,
    isString: { errorMessage: 'text must be a string' },
    isLength: {
        max: 2000,
        errorMessage: 'text must be at most 2000 characters',
    },
}
