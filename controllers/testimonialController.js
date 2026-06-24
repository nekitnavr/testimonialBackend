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
        
        return res.send('Monial')
    } catch (error) {
        console.error(error)
        return ApiResponse.failure(res, 'Failed to create testimonial')
    }
}

async function getTestimonials(req, res){
    // Возврат отзывов только авторизованного пользователя
    // Исключение мягко удалённых записей (isDeleted: false)
    // Поддержка query-параметров:
    // status — фильтр по статусу (например, ?status=completed)
    // page и limit — пагинация (по умолчанию: page 1, limit 10)
    // sort — поле сортировки (по умолчанию: createdAt, по убыванию)
    try {
        const {status, sort} = req.query
        const page = req.query.page ? parseInt(req.query.page) : 1
        const limit = req.query.limit ? parseInt(req.query.limit) : 10
        
        if (!statuses.includes(status)) return ApiResponse.badRequest(res, `Status doesn't exist`)

        const toSkip = (page-1)*limit
        const total = await Testimonial.countDocuments()
        let testimonials = await Testimonial.find({
                userId: req.user.userId,
                isDeleted: false,
                status: status
            })
            .skip(toSkip)
            .sort({
                [sort ? sort : 'createdAt'] : -1
            })
            .limit(limit)

        
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

module.exports = {createTestimonial, getTestimonials}