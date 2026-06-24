const ApiResponse = require("../lib/apiResponse")
const { verifyToken } = require("../lib/utils")

function auth(req, res, next){
    const token = req.headers.authorization.split(' ')[1]

    try {
        const user = verifyToken(token)
        req.user = user
    } catch (error) {
        return ApiResponse.unauthorized(res, 'User unathorized, invalid token')
    }
    
    next()
}

module.exports = auth