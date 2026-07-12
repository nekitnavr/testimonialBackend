const ApiResponse = require('../lib/apiResponse')
const { getDateRange, getOverview } = require('../lib/utils')

async function getTestimonialAnalytics(req, res, next) {
    try {
        let { startDate, endDate } = getDateRange(req.query.startDate, req.query.endDate)

        startDate = startDate || new Date(0)
        endDate = endDate || new Date()

        const filter = {
            isDeleted: false,
            createdAt: {
                $gte: startDate,
                $lte: endDate,
            },
            userId: req.user.userId,
        }

        const overview = await getOverview(filter)
        const data = {
            overview: overview,
            period: { startDate, endDate },
        }

        return ApiResponse.success(res, 'Fetched analytics successfully', data)
    } catch (error) {
        next(error)
    }
}

module.exports = {
    getTestimonialAnalytics,
}
