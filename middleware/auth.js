const ApiResponse = require('../lib/apiResponse')
const { verifyToken } = require('../lib/utils')
const User = require('../models/user')

async function auth(req, res, next) {
    const header = req.headers.authorization
    if (!header) return ApiResponse.unauthorized(res, 'Auth header required')

    const [authType, token] = header.split(' ')
    if (authType !== 'Bearer' || !token) {
        return ApiResponse.unauthorized(res, 'Auth header must be in this format: Bearer <token>')
    }

    let payload
    try {
        payload = verifyToken(token)
    } catch {
        return ApiResponse.unauthorized(res, 'User unathorized, invalid token')
    }

    try {
        const user = await User.findOne({ userId: payload.userId })
        if (!user || !user.isActive) {
            return ApiResponse.unauthorized(res, 'User is inactive or no longer exists')
        }

        req.user = { userId: user.userId, email: user.email }
        next()
    } catch (error) {
        next(error)
    }
}

module.exports = auth
