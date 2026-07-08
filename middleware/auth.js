const ApiResponse = require("../lib/apiResponse")
const { verifyToken } = require("../lib/utils")

function auth(req, res, next){
    const header = req.headers.authorization
    if (!header) return ApiResponse.unauthorized(res, 'Auth header required')

    const [authType, token] = header.split(' ')
    if (authType !== 'Bearer' || !token) {
        return ApiResponse.unauthorized(res, 'Auth header must be in this format: Bearer <token>')
    }

    try {
        const user = verifyToken(token)
        req.user = user
    } catch (error) {
        return ApiResponse.unauthorized(res, 'User unathorized, invalid token')
    }
    
    next()
}

module.exports = auth