const express = require('express')
const testimonialController = require('../controllers/testimonialController')
const router = express.Router()

router.post('/testimonials', testimonialController.createTestimonial)

module.exports = router