const ApiResponse = require('../lib/apiResponse')
const { matchedData } = require('express-validator')
const { registerUser, loginUser } = require('../services/authService')

async function register(req, res, next) {
    try {
        const data = matchedData(req, { locations: ['body'] })
        const result = await registerUser(data)

        return ApiResponse.created(res, 'User created', result)
    } catch (error) {
        next(error)
    }
}

async function login(req, res, next) {
    try {
        const data = matchedData(req, { locations: ['body'] })
        const result = await loginUser(data)

        return ApiResponse.success(res, 'Successfully logged in', result)
    } catch (error) {
        next(error)
    }
}

module.exports = { register, login }
