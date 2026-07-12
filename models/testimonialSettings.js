const mongoose = require('mongoose')
const { allowedChannels } = require('../lib/constants')

const testimonialSettingsSchema = new mongoose.Schema(
    {
        userId: {
            type: Number,
            required: true,
            unique: true,
        },
        isEnabled: {
            type: Boolean,
            required: false,
            default: false,
        },
        defaultVideoLength: {
            type: Number,
            required: false,
            default: 10,
            min: [1, 'defaultVideoLength must be greater than 0'],
        },
        videoLengthOptions: {
            type: [Number],
            required: false,
            default: [5, 10, 15, 20, 25],
            validate: {
                validator: (values) => values.every((value) => Number.isInteger(value) && value > 0),
                message: 'videoLengthOptions must contain only positive integers',
            },
        },
        questionnaire: {
            type: [String],
            required: false,
            default: ['What do you like about our service?'],
            validate: {
                validator: (values) => values.every((value) => typeof value === 'string' && value.trim().length > 0),
                message: 'questionnaire must not contain empty strings',
            },
        },
        sendingOptions: {
            type: [String],
            required: false,
            default: ['email', 'sms'],
            enum: {
                values: allowedChannels,
                message: 'sendingOptions contains an invalid channel',
            },
        },
        thankYouMessage: {
            type: String,
            required: false,
            default: 'Thank you!',
            maxlength: [500, 'thankYouMessage must be at most 500 characters'],
        },
        contactConsent: {
            enabled: {
                type: Boolean,
                default: true,
            },
            text: {
                type: String,
                default: 'Join our mailing list',
                maxlength: [200, 'contactConsent.text must be at most 200 characters'],
            },
        },
    },
    {
        timestamps: true,
    },
)

const TestimonialSettings = mongoose.model('TestimonialSettings', testimonialSettingsSchema)
module.exports = TestimonialSettings
