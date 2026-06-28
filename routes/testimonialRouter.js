const express = require('express')
const testimonialController = require('../controllers/testimonialController')
const router = express.Router()

router.get('/analytics', testimonialController.getTestimonialAnalytics)

router.post('/', testimonialController.createTestimonial)
router.get('/', testimonialController.getTestimonials)
router.get('/:testimonialId', testimonialController.getTestimonial)
router.put('/:testimonialId', testimonialController.updateTestimonial)
router.patch('/:testimonialId/status', testimonialController.updateStatus)
router.delete('/:testimonialId', testimonialController.deleteTestimonial)
router.post('/:testimonialId/share', testimonialController.shareTestimonial)

router.get('/settings', testimonialController.getTestimonialSettings)
router.post('/settings', testimonialController.upsertTestimonialSettings)



module.exports = router