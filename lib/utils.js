const jwt = require('jsonwebtoken')

function signToken(payload){
    return jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRY})
}

module.exports = {signToken}