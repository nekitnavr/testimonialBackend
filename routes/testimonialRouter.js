const express = require('express')
const testimonialController = require('../controllers/testimonialController')
const router = express.Router()

router.post('/testimonials', testimonialController.createTestimonial)
router.get('/testimonials', testimonialController.getTestimonials)

module.exports = router