const mongoose = require('mongoose')
const Testimonial = require('../models/testimonial')
const ApiResponse = require('../lib/apiResponse')
const uuid = require('uuid')
const { statuses } = require('../lib/constants')
const emailValidator = require('email-validator')

async function createTestimonial(req, res){
    // Авто-генерация testimonialId через uuid
    // Установка userId из JWT токена авторизованного пользователя
    // Валидация обязательных полей: customerName
    // Начальный статус: "draft"

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
        if(customerPhone && customerPhone < 9) return ApiResponse.badRequest(res, 'Phone numbers must be at lest 9 digits')
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
        
        return res.send('Monial')
    } catch (error) {
        console.error(error)
        return ApiResponse.failure(res, 'Failed to create testimonial')
    }
}

module.exports = {createTestimonial}