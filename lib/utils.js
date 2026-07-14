const jwt = require('jsonwebtoken')
const Testimonial = require('../models/testimonial')
const { statuses } = require('./constants')
const AppError = require('./appError')

function signToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY || '7d' })
}

function verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET)
}

function canTransitionStatus(fromStatus, toStatus) {
    const fromIndex = statuses.indexOf(fromStatus)
    const toIndex = statuses.indexOf(toStatus)

    if (fromIndex === -1 || toIndex === -1) return false

    return toIndex - fromIndex === 1
}

function getDateRange(startDateStr, endDateStr) {
    const startDate = startDateStr ? new Date(startDateStr) : null
    const endDate = endDateStr ? new Date(endDateStr) : null

    if (startDate && isNaN(startDate)) throw new AppError('Invalid start date format', 400)
    if (endDate && isNaN(endDate)) throw new AppError('Invalid end date format', 400)
    if (startDate && endDate && startDate > endDate) throw new AppError('startDate must be earlier than or equal to endDate', 400)

    return { startDate, endDate }
}

async function getOverview(filter) {
    const overview = await Testimonial.aggregate([
        { $match: filter },
        {
            $facet: {
                stats: [
                    {
                        $group: {
                            _id: null,
                            averageRating: { $avg: '$rating' },
                            total: { $sum: 1 },
                        },
                    },
                ],
                byStatus: [
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            statuses: {
                                $push: {
                                    k: '$_id',
                                    v: '$count',
                                },
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            byStatus: { $arrayToObject: '$statuses' },
                        },
                    },
                ],
            },
        },
        {
            $project: {
                total: { $arrayElemAt: ['$stats.total', 0] },
                byStatus: { $arrayElemAt: ['$byStatus.byStatus', 0] },
                averageRating: { $arrayElemAt: ['$stats.averageRating', 0] },
            },
        },
    ])

    const byStatus = Object.fromEntries(statuses.map((status) => [status, overview[0].byStatus?.[status] || 0]))
    if (Object.keys(overview[0]).length === 0) {
        return {
            total: 0,
            byStatus,
            averageRating: 0,
        }
    }
    return {
        ...overview[0],
        byStatus,
        averageRating: overview[0].averageRating ?? 0,
    }
}

function mergeFields(target, updates) {
    Object.entries(updates).forEach(([field, value]) => {
        const isPlainObject = value !== null && typeof value === 'object' && !Array.isArray(value)

        if (isPlainObject && target[field] && typeof target[field] === 'object') {
            Object.assign(target[field], value)
        } else {
            target[field] = value
        }
    })
}

module.exports = {
    signToken,
    verifyToken,
    getDateRange,
    getOverview,
    canTransitionStatus,
    mergeFields,
}
