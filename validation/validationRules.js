module.exports.customerEmailRule = {
    optional: true,
    trim: true,
    isEmail: {
        errorMessage: 'Invalid email',
    },
}

module.exports.customerPhoneRule = {
    optional: true,
    isLength: {
        min: 9,
        errorMessage: 'Phone numbers must be at lest 9 digits',
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
}
