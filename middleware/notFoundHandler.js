const ApiResponse = require('../lib/apiResponse')

module.exports = (req, res) => {
    return ApiResponse.notFound(res, `Route ${req.method} ${req.originalUrl} not found`)
}
