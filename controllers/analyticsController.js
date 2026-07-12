const ApiResponse = require('../lib/apiResponse')
const { getAnalytics } = require('../services/analyticsService')

async function getTestimonialAnalytics(req, res, next) {
    try {
        const analytics = await getAnalytics(req.user.userId, { startDateStr: req.query.startDate, endDateStr: req.query.endDate })

        return ApiResponse.success(res, 'Fetched analytics successfully', analytics)
    } catch (error) {
        next(error)
    }
}

module.exports = {
    getTestimonialAnalytics,
}
