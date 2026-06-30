const mongoose = require('mongoose')
const Testimonial = require('../models/testimonial')
const ApiResponse = require('../lib/apiResponse')
const uuid = require('uuid')
const { statuses, allowedChannels, allowedTestimonialSettings, allowedTestimonialFields } = require('../lib/constants')
const emailValidator = require('email-validator')
const TestimonialSettings = require('../models/testimonialSettings')
const { findTestimonial, getChannelsFromReq, getDateRange, getOverview } = require('../lib/utils')

async function createTestimonial(req, res) {
    try {
        const {
            customerName,
            customerEmail,
            customerPhone,
            videoUrl,
            rating,
            text,
            consentGiven,
        } = req.body

        if (!customerName) return ApiResponse.badRequest(res, 'Customer name required')
        if (customerEmail && !emailValidator.validate(customerEmail)) return ApiResponse.badRequest(res, 'Invalid email format')
        if (customerPhone && customerPhone.length < 9) return ApiResponse.badRequest(res, 'Phone numbers must be at lest 9 digits')
        if (rating && (rating < 1 || rating > 5)) return ApiResponse.badRequest(res, 'Ratings must be 1 to 5')

        const testimonial = new Testimonial({
            testimonialId: uuid.v4(),
            userId: req.user.userId,
            customerName: customerName,
            customerEmail: customerEmail,
            customerPhone: customerPhone,
            videoUrl: videoUrl,
            rating: rating,
            text: text,
            status: 'draft',
            consentGiven: Boolean(consentGiven)
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
        if (req.query.page < 1) return ApiResponse.badRequest(res, 'Page must be greater than 0')
        if (req.query.limit < 1) return ApiResponse.badRequest(res, 'Limit must greater than 0')
        if (status && !statuses.includes(status)) return ApiResponse.badRequest(res, `Status invalid`)

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
        const total = await Testimonial.countDocuments(filter)

        let response = new ApiResponse(200, 'success',`User's testimonials`, testimonials)
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

        const {
            customerName,
            customerEmail,
            customerPhone,
            videoUrl,
            rating,
            text,
            consentGiven,
        } = req.body

        if (customerEmail && !emailValidator.validate(customerEmail)) return ApiResponse.badRequest(res, 'Invalid email format')
        if (customerPhone && customerPhone.length < 9) return ApiResponse.badRequest(res, 'Phone numbers must be at lest 9 digits')
        if (rating && (rating < 1 || rating > 5)) return ApiResponse.badRequest(res, 'Ratings must be 1 to 5')

        let updateData = {}
        allowedTestimonialFields.forEach(field => {
            if (req.body.hasOwnProperty(field)) updateData[field] = req.body[field]
        })
        Object.assign(testimonial, updateData)
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

        if (!statuses.includes(status)) return ApiResponse.badRequest(res, 'Status invalid')

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
        let updateData = {}
        allowedTestimonialSettings.forEach(setting => {
            if (req.body.hasOwnProperty(setting)) updateData[setting] = req.body[setting]
        })

        let settings = await TestimonialSettings.findOne({ userId: req.user.userId })
        if (!settings){
            await new TestimonialSettings({
                userId: req.user.userId,
                ...updateData
            }).save()
        }else{
            Object.assign(settings, updateData)
            await settings.save()
        }

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