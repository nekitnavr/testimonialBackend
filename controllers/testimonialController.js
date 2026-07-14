const ApiResponse = require('../lib/apiResponse')
const { matchedData } = require('express-validator')
const testimonialService = require('../services/testimonialService')

async function createTestimonial(req, res, next) {
    try {
        const data = matchedData(req, { locations: ['body'] })
        const testimonial = await testimonialService.createTestimonial(req.user.userId, data)

        return ApiResponse.created(res, 'Testimonial created', testimonial)
    } catch (error) {
        next(error)
    }
}

async function getTestimonials(req, res, next) {
    try {
        const query = matchedData(req, { locations: ['query'] })
        const { status, sort = 'createdAt', page = 1, limit = 10 } = query

        const { testimonials, pagination } = await testimonialService.listTestimonials(req.user.userId, {
            status,
            sort,
            page,
            limit,
        })
        const response = new ApiResponse(200, 'success', `User's testimonials`, testimonials)
        response.pagination = pagination

        return res.status(200).send(response)
    } catch (error) {
        next(error)
    }
}

async function getTestimonial(req, res, next) {
    try {
        const testimonial = await testimonialService.getOwnedTestimonial(req.user.userId, req.params.testimonialId)

        return ApiResponse.success(res, 'Found testimonial', testimonial)
    } catch (error) {
        next(error)
    }
}

async function updateTestimonial(req, res, next) {
    try {
        const data = matchedData(req, { locations: ['body'] })
        const testimonial = await testimonialService.updateTestimonial(req.user.userId, req.params.testimonialId, data)

        return ApiResponse.success(res, 'Testimonial updated', testimonial)
    } catch (error) {
        next(error)
    }
}

async function updateStatus(req, res, next) {
    try {
        const { status } = matchedData(req, { locations: ['body'] })
        const testimonial = await testimonialService.updateTestimonialStatus(req.user.userId, req.params.testimonialId, status)

        return ApiResponse.success(res, 'Testimonial status updated', testimonial)
    } catch (error) {
        next(error)
    }
}

async function deleteTestimonial(req, res, next) {
    try {
        const testimonial = await testimonialService.softDeleteTestimonial(req.user.userId, req.params.testimonialId)

        return ApiResponse.success(res, 'Testimonial deleted', testimonial)
    } catch (error) {
        next(error)
    }
}

async function shareTestimonial(req, res, next) {
    try {
        const { channels } = matchedData(req, { locations: ['body'] })
        const testimonial = await testimonialService.shareTestimonial(req.user.userId, req.params.testimonialId, channels)

        return ApiResponse.success(res, 'Testimonial shared', testimonial)
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
