const ApiResponse = require("../lib/apiResponse")
const { verifyToken } = require("../lib/utils")

function auth(req, res, next){
    const header = req.headers.authorization
    if (!header) return ApiResponse.badRequest(res, 'Auth header required')
    const token = header.split(' ')[1]

    try {
        const user = verifyToken(token)
        req.user = user
    } catch (error) {
        return ApiResponse.unauthorized(res, 'User unathorized, invalid token')
    }
    
    next()
}

module.exports = auth