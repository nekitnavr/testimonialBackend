const mongoose = require('mongoose')

const testimonialSettingsSchema = new mongoose.Schema({
    userId: { 
        type: Number,
        required: true,
        unique: true
    },
    isEnabled: { 
        type: Boolean,
        required: false,
        default: false
    },
    defaultVideoLength: { 
        type: Number,
        required: false,
        default: 10
    },
    videoLengthOptions: { 
        type: [Number],
        required: false,
        default: [5, 10, 15, 20, 25]
    },
    questionnaire: { 
        type: [String],
        required: false,
        default: ["What do you like about our service?"]
    },
    sendingOptions: { 
        type: [String],
        required: false,
        default: ["email", "sms"]
    },
    thankYouMessage: { 
        type: String,
        required: false,
        default: "Thank you!"
    },
    contactConsent: { 
        enabled: {
            type: Boolean,
            default: true
        }, 
        text: {
            type: String,
            default: "Join our mailing list"
        }
    },
}, {
    timestamps: true
})

const TestimonialSettings = mongoose.model('TestimonialSettings', testimonialSettingsSchema)
module.exports = TestimonialSettings