const ApiResponse = require('../lib/apiResponse')
const { allowedTestimonialSettings } = require('../lib/constants')
const { setFieldsFromReq } = require('../lib/utils')
const TestimonialSettings = require('../models/testimonialSettings')

async function upsertTestimonialSettings(req, res, next) {
    try {
        let isNew = false

        let settings = await TestimonialSettings.findOne({ userId: req.user.userId })
        if (!settings) {
            settings = await new TestimonialSettings({ userId: req.user.userId })
            isNew = true
        }

        setFieldsFromReq(req, settings, allowedTestimonialSettings)
        await settings.save()

        if (isNew) return ApiResponse.created(res, 'Created settings successfully')
        else return ApiResponse.success(res, 'Changed settings successfully')
    } catch (error) {
        next(error)
    }
}

async function getTestimonialSettings(req, res, next) {
    try {
        const settings = await TestimonialSettings.findOne({ userId: req.user.userId })

        let data = settings
        if (!settings) data = null

        return ApiResponse.success(res, 'Fetched setttings successfully', data)
    } catch (error) {
        next(error)
    }
}

module.exports = {
    upsertTestimonialSettings,
    getTestimonialSettings,
}
