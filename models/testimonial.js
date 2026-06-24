const mongoose = require('mongoose')
const { status } = require('../lib/constants')

const testimonialSchema = new mongoose.Schema({
    testimonialId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: Number,
        required: true,
        index: true
    },
    customerName: {
        type: String,
        required: true
    },
    customerEmail: {
        type: String,
        required: false
    },
    customerPhone: {
        type: String,
        required: false
    },
    videoUrl: {
        type: String,
        required: false
    },
    rating: {
        type: Number,
        required: false
    },
    text: {
        type: String,
        required: false
    },
    status: {
        type: String,
        required: true,
        enum: status,
        default: 'draft',
        index: true
    },
    consentGiven: {
        type: Boolean,
        required: false,
        default: false
    },
    sharedAt: {
        type: Date,
        required: false
    },
    sharedChannels: {
        type: [String],
        required: false
    },
    isDeleted: {
        type: Boolean,
        required: false,
        default: false
    },
    deletedAt: {
        type: Date,
        required: false
    }
}, { 
    timestamps: true 
})

testimonialSchema.index({ userId: 1, isDeleted: 1 })

const Testimonial = mongoose.model('Testimonial', testimonialSchema)
module.exports = Testimonial