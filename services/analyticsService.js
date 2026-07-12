const { getDateRange, getOverview } = require('../lib/utils')

async function getAnalytics(userId, { startDateStr, endDateStr }) {
    let { startDate, endDate } = getDateRange(startDateStr, endDateStr)
    startDate = startDate || new Date(0)
    endDate = endDate || new Date()

    const filter = {
        isDeleted: false,
        createdAt: { $gte: startDate, $lte: endDate },
        userId,
    }

    const overview = await getOverview(filter)
    return { overview, period: { startDate, endDate } }
}

module.exports = { getAnalytics }
