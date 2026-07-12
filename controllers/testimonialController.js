const Testimonial = require('../models/testimonial')
const ApiResponse = require('../lib/apiResponse')
const { randomUUID } = require('node:crypto')
const { allowedTestimonialFields } = require('../lib/constants')
const { findTestimonial, setFieldsFromReq, canTransitionStatus } = require('../lib/utils')
const { matchedData } = require('express-validator')

async function createTestimonial(req, res, next) {
    try {
        const testimonial = new Testimonial({
            testimonialId: randomUUID(),
            ...matchedData(req, { locations: ['body'] }),
            userId: req.user.userId,
            status: 'draft',
        })
        await testimonial.save()

        return ApiResponse.created(res, 'Testimonial created', testimonial)
    } catch (error) {
        next(error)
    }
}

async function getTestimonials(req, res, next) {
    try {
        const { status, sort } = req.query
        const page = req.query.page ? parseInt(req.query.page) : 1
        const limit = req.query.limit ? parseInt(req.query.limit) : 10
        const toSkip = (page - 1) * limit
        const filter = {
            userId: req.user.userId,
            isDeleted: false,
        }
        if (status) filter.status = status

        const [testimonials, total] = await Promise.all([
            Testimonial.find(filter)
                .sort({ [sort ? sort : 'createdAt']: -1 })
                .skip(toSkip)
                .limit(limit)
                .lean(),
            Testimonial.countDocuments(filter),
        ])

        const response = new ApiResponse(200, 'success', `User's testimonials`, testimonials)
        response.pagination = {
            total: total,
            page: page,
            limit: limit,
            pages: Math.ceil(total / limit),
        }

        return res.status(200).send(response)
    } catch (error) {
        next(error)
    }
}

async function getTestimonial(req, res, next) {
    try {
        const { testimonialId } = req.params

        const testimonial = await findTestimonial(req, res, testimonialId)
        if (!testimonial) return

        return ApiResponse.success(res, 'Found testimonial', testimonial)
    } catch (error) {
        next(error)
    }
}

async function updateTestimonial(req, res, next) {
    try {
        const { testimonialId } = req.params

        const testimonial = await findTestimonial(req, res, testimonialId)
        if (!testimonial) return

        setFieldsFromReq(req, testimonial, allowedTestimonialFields)
        await testimonial.save()

        return ApiResponse.success(res, 'Testimonial updated')
    } catch (error) {
        next(error)
    }
}

async function updateStatus(req, res, next) {
    try {
        const { status } = matchedData(req, { locations: ['body'] })
        const { testimonialId } = req.params

        const testimonial = await findTestimonial(req, res, testimonialId)
        if (!testimonial) return

        if (!canTransitionStatus(testimonial.status, status)) {
            return ApiResponse.badRequest(res, `Cannot transition from ${testimonial.status} to ${status}`)
        }

        testimonial.status = status
        if (status === 'shared') testimonial.sharedAt = new Date()
        await testimonial.save()

        return ApiResponse.success(res, 'Testimonial status updated')
    } catch (error) {
        next(error)
    }
}

async function deleteTestimonial(req, res, next) {
    try {
        const { testimonialId } = req.params

        const testimonial = await findTestimonial(req, res, testimonialId)
        if (!testimonial) return

        testimonial.isDeleted = true
        testimonial.deletedAt = new Date()
        await testimonial.save()

        return ApiResponse.success(res, 'Testimonial deleted')
    } catch (error) {
        next(error)
    }
}

async function shareTestimonial(req, res, next) {
    try {
        const { testimonialId } = req.params

        const testimonial = await findTestimonial(req, res, testimonialId)
        if (!testimonial) return

        if (!['completed', 'shared'].includes(testimonial.status)) {
            return ApiResponse.badRequest(
                res,
                `Cannot share testimonial in status "${testimonial.status}". Testimonial must be completed first.`,
            )
        }

        testimonial.sharedChannels = [
            ...new Set([...testimonial.sharedChannels, ...matchedData(req, { locations: ['body'] }).channels]),
        ]
        if (testimonial.status === 'completed') testimonial.status = 'shared'
        if (!testimonial.sharedAt) testimonial.sharedAt = new Date()
        await testimonial.save()

        return ApiResponse.success(res, 'Testimonial shared')
    } catch (error) {
        next(error)
    }
}

module.exports = {
    createTestimonial,
    getTestimonials,
    getTestimonial,
    updateTestimonial,
    updateStatus,
    deleteTestimonial,
    shareTestimonial,
}
