const ApiResponse = require('../lib/apiResponse')

module.exports = (error, req, res, _next) => {
    if (error.statusCode) {
        return res.status(error.statusCode).send(new ApiResponse(error.statusCode, 'failure', error.message))
    }

    if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0] || 'field'
        return ApiResponse.badRequest(res, `${field} already exists`)
    }

    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((e) => e.message)
        return ApiResponse.badRequest(res, messages.join('; '))
    }

    if (error.name === 'CastError') {
        return ApiResponse.badRequest(res, `Invalid value for field ${error.path}`)
    }

    console.error(error)
    return ApiResponse.failure(res, 'Internal server error')
}
