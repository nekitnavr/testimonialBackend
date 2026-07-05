const express = require('express')
const testimonialController = require('../controllers/testimonialController')
const validateSchema = require('../middleware/validateSchema')
const { createTestimonialSchema, getTestimonialsSchema, updateTestimonialSchema, updateStatusSchema, shareTestimonialSchema, getAnalyticsSchema, upsertTestimonialSettingsSchema } = require('../validation/validationSchemas')
const router = express.Router()

router.get('/analytics', validateSchema(getAnalyticsSchema), testimonialController.getTestimonialAnalytics)
router.get('/settings', testimonialController.getTestimonialSettings)
router.post('/settings', validateSchema(upsertTestimonialSettingsSchema), testimonialController.upsertTestimonialSettings)

router.post('/', validateSchema(createTestimonialSchema), testimonialController.createTestimonial)
router.get('/', validateSchema(getTestimonialsSchema), testimonialController.getTestimonials)
router.get('/:testimonialId', testimonialController.getTestimonial)
router.put('/:testimonialId', validateSchema(updateTestimonialSchema), testimonialController.updateTestimonial)
router.patch('/:testimonialId/status', validateSchema(updateStatusSchema), testimonialController.updateStatus)
router.delete('/:testimonialId', testimonialController.deleteTestimonial)
router.post('/:testimonialId/share', validateSchema(shareTestimonialSchema), testimonialController.shareTestimonial)

module.exports = router