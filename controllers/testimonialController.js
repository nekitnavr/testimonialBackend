const mongoose = require('mongoose')
const Testimonial = require('../models/testimonial')
const ApiResponse = require('../lib/apiResponse')
const uuid = require('uuid')
const { statuses, allowedChannels } = require('../lib/constants')
const emailValidator = require('email-validator')

async function createTestimonial(req, res){
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

        if(!customerName) return ApiResponse.badRequest(res, 'Customer name required')
        if(customerEmail && !emailValidator.validate(customerEmail)) return ApiResponse.badRequest(res, 'Invalid email format')
        if(customerPhone && customerPhone.length < 9) return ApiResponse.badRequest(res, 'Phone numbers must be at lest 9 digits')
        if (rating && rating < 1 && rating > 5) return ApiResponse.badRequest(res, 'Ratings must be 1 to 5')

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
        
        return res.send(ApiResponse.success('Testimonial created'))
    } catch (error) {
        console.error(error)
        return ApiResponse.failure(res, 'Failed to create testimonial')
    }
}

async function getTestimonials(req, res){
    try {
        const {status, sort} = req.query
        if (req.query.page < 1) return ApiResponse.badRequest(res, 'Page must be greater than 0')
        if (req.query.limit < 1) return ApiResponse.badRequest(res, 'Limit must greater than 0')
        if (!statuses.includes(status)) return ApiResponse.badRequest(res, `Status doesn't exist`)
        
        const page = req.query.page ? parseInt(req.query.page) : 1
        const limit = req.query.limit ? parseInt(req.query.limit) : 10
        const toSkip = (page-1)*limit
        const filter = {
            userId: req.user.userId,
            isDeleted: false,
            status: status
        }

        let testimonials = await Testimonial
            .find(filter)
            .skip(toSkip)
            .sort({
                [sort ? sort : 'createdAt'] : -1
            })
            .limit(limit)
        const total = await Testimonial.countDocuments(filter)

        let response = ApiResponse.success(`User's testimonials`, testimonials)
        response.pagination = {
            "total": total,
            "page": page,
            "limit": limit,
            "pages": Math.ceil(total/limit)
        }

        return res.status(200).send(response)
    } catch (error) {
        console.error(error)
        return ApiResponse.failure(res, 'Failed to fetch testimonials')
    }
}

async function updateStatus(req, res) {
    try {
        const {status} = req.body
        const {testimonialId} = req.params
        
        if(!statuses.includes(status)) return ApiResponse.badRequest(res, 'Status invalid')
        if(!testimonialId) return ApiResponse.badRequest(res, 'Testimonial Id required')

        const testimonial = await Testimonial.findOne({testimonialId: testimonialId})
        if (!testimonial || testimonial.isDeleted) return ApiResponse.notFound(res, 'Testimonial not found')
        if (testimonial.userId != req.user.userId) return ApiResponse.forbidden(res, `Can't edit other users' testimonials`)

        const canTransition = (statuses.indexOf(status)-statuses.indexOf(testimonial.status)) == 1
        if (!canTransition) {
            return ApiResponse.badRequest(res, `Cannot transition from ${testimonial.status} to ${status}`)
        }
        
        testimonial.status = status
        if (status == 'shared') testimonial.sharedAt = new Date()
        await testimonial.save()
        
        return res.send(ApiResponse.success('Testimonial status updated'))
    } catch (error) {
        console.error(error)
        return ApiResponse.failure(res, 'Failed to change status')
    }
}

async function deleteTestimonial(req, res){
    try {
        const {testimonialId} = req.params
        if (!testimonialId) return ApiResponse.badRequest(res, 'Testimonial Id required')

        const testimonial = await Testimonial.findOne({testimonialId: testimonialId})
        if (!testimonial || testimonial.isDeleted) return ApiResponse.notFound(res, 'Testimonial not found')
        if (testimonial.userId != req.user.userId) return ApiResponse.forbidden(res, `Can't delete other users' testimonials`)

        testimonial.isDeleted = true
        testimonial.deletedAt = new Date()
        await testimonial.save()
        
        return res.send(ApiResponse.success('Testimonial deleted'))
    } catch (error) {
        console.error(error)
        return ApiResponse.failure(res, 'Failed to delete testimonial')
    }
}

async function shareTestimonial(req, res){
    try {
        const {testimonialId} = req.params
        if (!testimonialId) return ApiResponse.badRequest(res, 'Testimonial Id required')

        const testimonial = await Testimonial.findOne({testimonialId: testimonialId})
        if (!testimonial || testimonial.isDeleted) return ApiResponse.notFound(res, 'Testimonial not found')
        if (testimonial.userId != req.user.userId) return ApiResponse.forbidden(res, `Can't share other users' testimonials`)

        let {channels} = req.body
        if (Array.isArray(channels)){
            channels = [...new Set(channels)]
            const allAllowed = channels.every(channel=>allowedChannels.includes(channel))
            if (!allAllowed) return ApiResponse.badRequest(res, 'Invalid sharing channels')
        } else {
            return ApiResponse.badRequest(res, 'Channels must be an array')
        }

        const mergedChannels = [...new Set([...testimonial.sharedChannels, ...channels])]
        testimonial.sharedChannels = mergedChannels
        if (testimonial.status == 'completed') testimonial.status = 'shared'
        if (!testimonial.sharedAt) testimonial.sharedAt = new Date()
        await testimonial.save()
        
        return res.send(ApiResponse.success('Testimonial shared'))
    } catch (error) {
        console.error(error)
        return ApiResponse.failure(res, 'Failed to share testimonial')
    }
}

module.exports = {
    createTestimonial, 
    getTestimonials, 
    updateStatus, 
    deleteTestimonial, 
    shareTestimonial
}