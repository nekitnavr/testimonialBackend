const mongoose = require('mongoose')
const { statuses, allowedChannels } = require('../lib/constants')

const testimonialSchema = new mongoose.Schema(
    {
        testimonialId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        userId: {
            type: Number,
            required: true,
            index: true,
        },
        customerName: {
            type: String,
            required: true,
        },
        customerEmail: {
            type: String,
            required: false,
            lowercase: true,
            trim: true,
        },
        customerPhone: {
            type: String,
            required: false,
        },
        videoUrl: {
            type: String,
            required: false,
        },
        rating: {
            type: Number,
            required: false,
            min: [1, 'Rating must be greater or equal to 1'],
            max: [5, 'Rating must be less or equal to 5'],
        },
        text: {
            type: String,
            required: false,
        },
        status: {
            type: String,
            required: true,
            enum: statuses,
            default: 'draft',
            index: true,
        },
        consentGiven: {
            type: Boolean,
            required: false,
            default: false,
        },
        sharedAt: {
            type: Date,
            required: false,
        },
        sharedChannels: {
            type: [String],
            required: false,
            enum: allowedChannels,
            default: [],
        },
        isDeleted: {
            type: Boolean,
            required: false,
            default: false,
        },
        deletedAt: {
            type: Date,
            required: false,
        },
    },
    {
        timestamps: true,
    },
)

testimonialSchema.index({ userId: 1, isDeleted: 1 })

const Testimonial = mongoose.model('Testimonial', testimonialSchema)
module.exports = Testimonial
