const jwt = require('jsonwebtoken')
const Testimonial = require('../models/testimonial')
const ApiResponse = require('./apiResponse')
const { allowedChannels, statuses } = require('./constants')

function signToken(payload){
    return jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRY || '7d'})
}

function verifyToken(token){
    return jwt.verify(token, process.env.JWT_SECRET)
}

function setFieldsFromReq(req, object, allowedFields){
    allowedFields.forEach(field => {
        if (!Object.hasOwn(req.body, field)) return

        const incoming = req.body[field]
        const isPlainObject = incoming !== null && typeof incoming === 'object' && !Array.isArray(incoming)

        if (isPlainObject && object[field] && typeof object[field] === 'object') {
            Object.assign(object[field], incoming)
        } else {
            object[field] = incoming
        }
    })
}

function canTransitionStatus(fromStatus, toStatus){
    const fromIndex = statuses.indexOf(fromStatus)
    const toIndex = statuses.indexOf(toStatus)

    if (fromIndex === -1 || toIndex === -1) return false

    return (toIndex - fromIndex) === 1
}

function getDateRange(startDateStr, endDateStr){
    const startDate = startDateStr ? new Date(startDateStr) : null
    const endDate = endDateStr ? new Date(endDateStr) : null

    if (startDate && isNaN(startDate)) {
        const error = new Error('Invalid start date format')
        error.statusCode = 400
        throw error
    }
    if (endDate && isNaN(endDate)) {
        const error = new Error('Invalid end date format')
        error.statusCode = 400
        throw error
    }

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

    if (Object.keys(overview[0]).length == 0) {
        return {
            total: 0,
            byStatus: {},
            averageRating: 0
        }
    }
    
    return  {
        ...overview[0],
        averageRating: overview[0].averageRating ?? 0
    }
}

module.exports = {
    signToken, 
    verifyToken,
    setFieldsFromReq, 
    findTestimonial, 
    getDateRange,
    getOverview,
    canTransitionStatus
}