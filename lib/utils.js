const jwt = require('jsonwebtoken')
const Testimonial = require('../models/testimonial')
const ApiResponse = require('./apiResponse')
const { allowedChannels } = require('./constants')

function signToken(payload){
    return jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRY})
}

function verifyToken(token){
    return jwt.verify(token, process.env.JWT_SECRET)
}

function setFieldsFromReq(req, object, allowedFields){
    allowedFields.forEach(field => {
        if (req.body.hasOwnProperty(field)) object[field] = req.body[field]
    })
}

function getChannelsFromReq(req, res){
    let { channels } = req.body
    if (Array.isArray(channels)) {
        channels = [...new Set(channels)]
        const allAllowed = channels.every(channel => allowedChannels.includes(channel))
        if (!allAllowed) {
            ApiResponse.badRequest(res, 'Invalid sharing channels')
            return null 
        }
    } else {
        ApiResponse.badRequest(res, 'Channels must be an array')
        return null 
    }

    return channels
}

function getDateRange(startDateStr, endDateStr){
    const startDate = startDateStr ? new Date(startDateStr) : null
    const endDate = endDateStr ? new Date(endDateStr) : null

    if (startDate && isNaN(startDate)) throw new Error('Invalid start date format')
    if (endDate && isNaN(endDate)) throw new Error('Invalid end date format')

    return {startDate, endDate}
}

async function findTestimonial(req, res, testimonialId){
    const testimonial = await Testimonial.findOne({ testimonialId: testimonialId })
    if (!testimonial || testimonial.isDeleted) {
        ApiResponse.notFound(res, 'Testimonial not found')
        return null
    }
    if (testimonial.userId != req.user.userId) {
        ApiResponse.forbidden(res, `Can't view, edit and delete other users' testimonials`)
        return null
    }
    
    return testimonial
}

async function getOverview(filter){
    return await Testimonial.aggregate([
        { $match: filter },
        { $group: {
            _id: '$status',
            count: {$sum: 1},
            totalRating: { $sum: '$rating' }
        }},
        { $group: {
            _id: null,
            byStatus: {
                $push: { k: '$_id', v: '$count' }
            },
            total: { $sum: '$count' },
            totalRating: { $sum: '$totalRating' }
        }},
        { $project: {
            _id: 0,
            total: 1,
            byStatus: { $arrayToObject: '$byStatus' },
            avgRating: {$divide: ["$totalRating", "$total"]}
        }}
    ])
}

module.exports = {
    signToken, 
    verifyToken,
    setFieldsFromReq, 
    findTestimonial, 
    getChannelsFromReq,
    getDateRange,
    getOverview,
}