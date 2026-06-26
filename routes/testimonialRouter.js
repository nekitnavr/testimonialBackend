const express = require('express')
const testimonialController = require('../controllers/testimonialController')
const router = express.Router()

router.post('/', testimonialController.createTestimonial)
router.get('/', testimonialController.getTestimonials)
router.patch('/:testimonialId/status', testimonialController.updateStatus)
router.delete('/:testimonialId', testimonialController.deleteTestimonial)
router.post('/:testimonialId/share', testimonialController.shareTestimonial)

router.get('/settings', testimonialController.getTestimonialSettings)
router.post('/settings', testimonialController.upsertTestimonialSettings)
router.get('/analytics', testimonialController.upsertTestimonialSettings)

module.exports = router