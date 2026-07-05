const mongoose = require('mongoose')
const Testimonial = require('../models/testimonial')
const ApiResponse = require('../lib/apiResponse')
const { randomUUID } = require('node:crypto')
const { statuses, allowedChannels, allowedTestimonialSettings, allowedTestimonialFields } = require('../lib/constants')
const TestimonialSettings = require('../models/testimonialSettings')
const { findTestimonial, getChannelsFromReq, getDateRange, getOverview, setFieldsFromReq, canTransitionStatus } = require('../lib/utils')

async function createTestimonial(req, res, next) {
    try {
        const testimonial = new Testimonial({
            testimonialId: randomUUID(),
            userId: req.user.userId,
            ...req.body,            
            status: 'draft',
        })
        await testimonial.save()

        return ApiResponse.created(res, 'Testimonial created')
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
        let filter = {
            userId: req.user.userId,
            isDeleted: false,
        }
        if (status) filter.status = status

        let testimonials = await Testimonial
            .find(filter)
            .skip(toSkip)
            .sort({
                [sort ? sort : 'createdAt']: -1
            })
            .limit(limit)
            
        let response = new ApiResponse(200, 'success',`User's testimonials`, testimonials)
        const total = await Testimonial.countDocuments(filter)
        response.pagination = {
            "total": total,
            "page": page,
            "limit": limit,
            "pages": Math.ceil(total / limit)
        }

        return res.status(200).send(response)
    } catch (error) {
        next(error)
    }
}

async function getTestimonial(req, res, next){
    try {
        const { testimonialId } = req.params

        const testimonial = await findTestimonial(req, res, testimonialId)
        if (!testimonial) return

        return ApiResponse.success(res, 'Found testimonial', testimonial)
    } catch (error) {
        next(error)
    }
}

async function updateTestimonial(req,res, next){
    try {
        const { testimonialId } = req.params

        let testimonial = await findTestimonial(req, res, testimonialId)
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
        const { status } = req.body
        const { testimonialId } = req.params

        const testimonial = await findTestimonial(req, res, testimonialId)
        if (!testimonial) return

        if (!canTransitionStatus(testimonial.status, status)) {
            return ApiResponse.badRequest(res, `Cannot transition from ${testimonial.status} to ${status}`)
        }

        testimonial.status = status
        if (status == 'shared') testimonial.sharedAt = new Date()
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

        testimonial.sharedChannels = [...new Set([
            ...testimonial.sharedChannels,
            ...req.body.channels
        ])]
        if (testimonial.status == 'completed') testimonial.status = 'shared'
        if (!testimonial.sharedAt) testimonial.sharedAt = new Date()
        await testimonial.save()

        return ApiResponse.success(res, 'Testimonial shared')
    } catch (error) {
        next(error)
    }
}

///
async function upsertTestimonialSettings(req, res, next) {
    try {
        let isNew = false
        
        let settings = await TestimonialSettings.findOne({ userId: req.user.userId })
        if (!settings) {
            settings = await new TestimonialSettings({ userId: req.user.userId })
            isNew = true
        }

        setFieldsFromReq(req, settings, allowedTestimonialSettings)
        await settings.save()

        if(isNew)
            return ApiResponse.created(res, 'Created settings successfully')
        else
            return ApiResponse.success(res, 'Changed settings successfully')
    } catch (error) {
        next(error)
    }
}

async function getTestimonialSettings(req, res, next) {
    try {
        const settings = await TestimonialSettings.findOne({ userId: req.user.userId })

        let data = settings
        if (!settings) data = null

        return ApiResponse.success(res, 'Fetched setttings successfully', data)
    } catch (error) {
        next(error)
    }
}

///
async function getTestimonialAnalytics(req, res, next) {
    try {
        const {startDate, endDate} = getDateRange(req.query.startDate, req.query.endDate)

        const filter = {
            isDeleted: false,
            createdAt: {
                $gte: startDate ? startDate : new Date(0),
                $lte: endDate ? endDate : new Date()
            },
            userId: req.user.userId
        }
        
        const overview = await getOverview(filter)
        const data = {
            overview: overview,
            period: { startDate: startDate, endDate: endDate }
        }

        return ApiResponse.success(res, 'Fetched analytics successfully', data)
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
    upsertTestimonialSettings,
    getTestimonialSettings,
    getTestimonialAnalytics
}