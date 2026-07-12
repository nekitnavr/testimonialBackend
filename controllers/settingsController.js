const ApiResponse = require('../lib/apiResponse')
const { upsertSettings, getSettings } = require('../services/setttingsService')

async function upsertTestimonialSettings(req, res, next) {
    try {
        const { isNew } = await upsertSettings(req.user.userId, req.body)

        if (isNew) return ApiResponse.created(res, 'Created settings successfully')
        else return ApiResponse.success(res, 'Changed settings successfully')
    } catch (error) {
        next(error)
    }
}

async function getTestimonialSettings(req, res, next) {
    try {
        const settings = await getSettings(req.user.userId)

        return ApiResponse.success(res, 'Fetched setttings successfully', settings || null)
    } catch (error) {
        next(error)
    }
}

module.exports = {
    upsertTestimonialSettings,
    getTestimonialSettings,
}
