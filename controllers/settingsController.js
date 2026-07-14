const { matchedData } = require('express-validator')
const ApiResponse = require('../lib/apiResponse')
const { upsertSettings, getSettings } = require('../services/settingsService')

async function upsertTestimonialSettings(req, res, next) {
    try {
        const data = matchedData(req, { locations: ['body'] })
        const settings = await upsertSettings(req.user.userId, data)
        return ApiResponse.success(res, 'Settings saved successfully', settings)
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
