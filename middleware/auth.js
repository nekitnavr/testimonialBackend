const ApiResponse = require("../lib/apiResponse")
const { verifyToken } = require("../lib/utils")

function auth(req, res, next){
    const token = req.headers.authorization.split(' ')[1]

    try {
        const user = verifyToken(token)
        req.user = user
    } catch (error) {
        return res.status(401).send(ApiResponse.unauthorized('User unathorized'))
    }
    
    next()
}

module.exports = auth