const express = require('express')
const testimonialController = require('../controllers/testimonialController')
const validateSchema = require('../middleware/validateSchema')
const { createTestimonialSchema, getTestimonialsSchema, updateTestimonialSchema, updateStatusSchema } = require('../lib/validationSchemas')
const router = express.Router()

router.get('/analytics', testimonialController.getTestimonialAnalytics)

router.post('/', validateSchema(createTestimonialSchema), testimonialController.createTestimonial)
router.get('/', validateSchema(getTestimonialsSchema), testimonialController.getTestimonials)
router.get('/:testimonialId', testimonialController.getTestimonial)
router.put('/:testimonialId', validateSchema(updateTestimonialSchema), testimonialController.updateTestimonial)
router.patch('/:testimonialId/status', validateSchema(updateStatusSchema), testimonialController.updateStatus)
router.delete('/:testimonialId', testimonialController.deleteTestimonial)
router.post('/:testimonialId/share', testimonialController.shareTestimonial)

router.get('/settings', testimonialController.getTestimonialSettings)
router.post('/settings', testimonialController.upsertTestimonialSettings)



module.exports = router