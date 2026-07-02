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
    const overview = await Testimonial.aggregate([
        { $match: filter },
        { $facet: {
            stats: [
                { $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                    total: { $sum: 1}
                }}
            ],
            byStatus: [
                { $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }},
                { $group: {
                    _id: null,
                    statuses: {
                        $push: {
                            k: "$_id",
                            v: "$count"
                        }
                    }
                }},
                { $project: {
                    _id: 0,
                    byStatus: { $arrayToObject: "$statuses" }
                }}
            ]}
        },
        { $project: {
                total: { $arrayElemAt: ["$stats.total", 0] },
                byStatus: { $arrayElemAt: ["$byStatus.byStatus", 0] },
                averageRating: { $arrayElemAt: ["$stats.averageRating", 0] },
            }
        }
    ])
    
    return Object.keys(overview[0]).length == 0 ? {
        total: 0,
        byStatus: {},
        averageRating: 0
    } : overview[0]
}

module.exports = {
    signToken, 
    verifyToken,
    setFieldsFromReq, 
    findTestimonial, 
    getDateRange,
    getOverview,
}