const { randomUUID } = require('node:crypto')
const Testimonial = require('../models/testimonial')
const { canTransitionStatus } = require('../lib/utils')
const AppError = require('../lib/appError')

async function createTestimonial(userId, data) {
    const testimonial = new Testimonial({
        testimonialId: randomUUID(),
        ...data,
        userId,
        status: 'draft',
    })
    await testimonial.save()
    return testimonial
}

async function listTestimonials(userId, { status, sort, page, limit }) {
    const toSkip = (page - 1) * limit
    const filter = { userId, isDeleted: false }
    if (status) filter.status = status

    const [testimonials, total] = await Promise.all([
        Testimonial.find(filter)
            .sort({ [sort || 'createdAt']: -1 })
            .skip(toSkip)
            .limit(limit)
            .lean(),
        Testimonial.countDocuments(filter),
    ])

    return {
        testimonials,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    }
}

async function getOwnedTestimonial(userId, testimonialId) {
    const testimonial = await Testimonial.findOne({ testimonialId })
    if (!testimonial || testimonial.isDeleted) {
        throw new AppError('Testimonial not found', 404)
    }
    if (testimonial.userId !== userId) {
        throw new AppError(`Can't view, edit and delete other users' testimonials`, 403)
    }
    return testimonial
}

async function updateTestimonial(userId, testimonialId, updates) {
    const testimonial = await getOwnedTestimonial(userId, testimonialId)

    Object.entries(updates).forEach(([field, value]) => {
        const isPlainObject = value !== null && typeof value === 'object' && !Array.isArray(value)
        if (isPlainObject && testimonial[field] && typeof testimonial[field] === 'object') {
            Object.assign(testimonial[field], value)
        } else {
            testimonial[field] = value
        }
    })

    await testimonial.save()
    return testimonial
}

async function updateTestimonialStatus(userId, testimonialId, newStatus) {
    const testimonial = await getOwnedTestimonial(userId, testimonialId)

    if (!canTransitionStatus(testimonial.status, newStatus)) {
        throw new AppError(`Cannot transition from ${testimonial.status} to ${newStatus}`, 400)
    }

    testimonial.status = newStatus
    if (newStatus === 'shared') testimonial.sharedAt = new Date()
    await testimonial.save()
    return testimonial
}

async function softDeleteTestimonial(userId, testimonialId) {
    const testimonial = await getOwnedTestimonial(userId, testimonialId)

    testimonial.isDeleted = true
    testimonial.deletedAt = new Date()
    await testimonial.save()
    return testimonial
}

async function shareTestimonial(userId, testimonialId, channels) {
    const testimonial = await getOwnedTestimonial(userId, testimonialId)

    if (!['completed', 'shared'].includes(testimonial.status)) {
        throw new AppError(`Cannot share testimonial in status "${testimonial.status}". Testimonial must be completed first.`, 400)
    }

    testimonial.sharedChannels = [...new Set([...testimonial.sharedChannels, ...channels])]
    if (testimonial.status === 'completed') testimonial.status = 'shared'
    if (!testimonial.sharedAt) testimonial.sharedAt = new Date()
    await testimonial.save()
    return testimonial
}

module.exports = {
    createTestimonial,
    listTestimonials,
    getOwnedTestimonial,
    updateTestimonial,
    updateTestimonialStatus,
    softDeleteTestimonial,
    shareTestimonial,
}
