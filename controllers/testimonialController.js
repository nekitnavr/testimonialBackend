const mongoose = require('mongoose')
const Testimonial = require('../models/testimonial')
const ApiResponse = require('../lib/apiResponse')
const uuid = require('uuid')
const { statuses, allowedChannels, allowedTestimonialSettings, allowedTestimonialFields } = require('../lib/constants')
const TestimonialSettings = require('../models/testimonialSettings')
const { findTestimonial, getChannelsFromReq, getDateRange, getOverview, setFieldsFromReq } = require('../lib/utils')

async function createTestimonial(req, res) {
    try {
        const testimonial = new Testimonial({
            testimonialId: uuid.v4(),
            userId: req.user.userId,
            ...req.body,            
            status: 'draft',
        })
        await testimonial.save()

        return ApiResponse.created(res, 'Testimonial created')
    } catch (error) {
        console.error(error)
        return ApiResponse.failure(res, 'Failed to create testimonial')
    }
}

async function getTestimonials(req, res) {
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
        console.error(error)
        return ApiResponse.failure(res, 'Failed to fetch testimonials')
    }
}

async function getTestimonial(req, res){
    try {
        const { testimonialId } = req.params

        const testimonial = await findTestimonial(req, res, testimonialId)
        if (!testimonial) return

        return ApiResponse.success(res, 'Found testimonial', testimonial)
    } catch (error) {
        console.error(error)
        return ApiResponse.failure(res, 'Failed to fetch testimonial')
    }
}

async function updateTestimonial(req,res){
    try {
        const { testimonialId } = req.params

        let testimonial = await findTestimonial(req, res, testimonialId)
        if (!testimonial) return

        setFieldsFromReq(req, testimonial, allowedTestimonialFields)
        await testimonial.save()

        return ApiResponse.success(res, 'Testimonial updated')
    } catch (error) {
        console.error(error)
        return ApiResponse.failure(res, 'Failed to update testimonial')
    }
}

async function updateStatus(req, res) {
    try {
        const { status } = req.body
        const { testimonialId } = req.params

        const testimonial = await findTestimonial(req, res, testimonialId)
        if (!testimonial) return

        const canTransition = (statuses.indexOf(status) - statuses.indexOf(testimonial.status)) == 1
        if (!canTransition) {
            return ApiResponse.badRequest(res, `Cannot transition from ${testimonial.status} to ${status}`)
        }

        testimonial.status = status
        if (status == 'shared') testimonial.sharedAt = new Date()
        await testimonial.save()

        return ApiResponse.success(res, 'Testimonial status updated')
    } catch (error) {
        console.error(error)
        return ApiResponse.failure(res, 'Failed to change status')
    }
}

async function deleteTestimonial(req, res) {
    try {
        const { testimonialId } = req.params

        const testimonial = await findTestimonial(req, res, testimonialId)
        if (!testimonial) return

        testimonial.isDeleted = true
        testimonial.deletedAt = new Date()
        await testimonial.save()

        return ApiResponse.success(res, 'Testimonial deleted')
    } catch (error) {
        console.error(error)
        return ApiResponse.failure(res, 'Failed to delete testimonial')
    }
}

async function shareTestimonial(req, res) {
    try {
        const { testimonialId } = req.params

        const testimonial = await findTestimonial(req, res, testimonialId)
        if (!testimonial) return

        const channels = getChannelsFromReq(req, res)

        const mergedChannels = [...new Set([...testimonial.sharedChannels, ...channels])]
        testimonial.sharedChannels = mergedChannels
        if (testimonial.status == 'completed') testimonial.status = 'shared'
        if (!testimonial.sharedAt) testimonial.sharedAt = new Date()
        await testimonial.save()

        return ApiResponse.success(res, 'Testimonial shared')
    } catch (error) {
        console.error(error)
        return ApiResponse.failure(res, 'Failed to share testimonial')
    }
}

///
async function upsertTestimonialSettings(req, res) {
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
        console.error(error)
        return ApiResponse.failure(res, 'Failed to change settings')
    }
}

async function getTestimonialSettings(req, res) {
    try {
        const settings = await TestimonialSettings.findOne({ userId: req.user.userId })

        let data = { settings: settings }
        if (!settings) data = null

        return ApiResponse.success(res, 'Fetched setttings successfully', data)
    } catch (error) {
        console.error(error)
        return ApiResponse.failure(res, 'Failed to fetch settings')
    }
}

///
async function getTestimonialAnalytics(req, res) {
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
            overview: overview[0],
            period: { startDate: startDate, endDate: endDate }
        }

        return ApiResponse.success(res, 'Fetched analytics successfully', data)
    } catch (error) {
        console.error(error)
        if (error.message.includes('date format')){
            return ApiResponse.badRequest(res, error.message)
        }
        return ApiResponse.failure(res, 'Failed to fetch testimonial analytics')
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