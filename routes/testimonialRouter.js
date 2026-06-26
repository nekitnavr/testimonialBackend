const express = require('express')
const testimonialController = require('../controllers/testimonialController')
const router = express.Router()

router.post('/testimonials', testimonialController.createTestimonial)
router.get('/testimonials', testimonialController.getTestimonials)
router.patch('/testimonials/:testimonialId/status', testimonialController.updateStatus)
router.delete('/testimonials/:testimonialId', testimonialController.deleteTestimonial)
router.post('/testimonials/:testimonialId/share', testimonialController.shareTestimonial)

router.get('/testimonials/settings', testimonialController.getTestimonialSettings)
router.post('/testimonials/settings', testimonialController.upsertTestimonialSettings)

module.exports = router