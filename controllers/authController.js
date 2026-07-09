const User = require('../models/user')
const bcrypt = require('bcrypt')
const { saltRounds } = require('../lib/constants')
const ApiResponse = require('../lib/apiResponse')
const { signToken } = require('../lib/utils')
const Counter = require('../models/counter')
const { matchedData } = require('express-validator')

async function register(req, res, next) {
    try {
        const { password, ...data } = matchedData(req, { locations: ['body'] })

        const counter = await Counter.findOneAndUpdate(
            { counterName: 'userId' },
            { $inc: { sequence: 1 } },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
        )
        const hashedPassword = await bcrypt.hash(password, saltRounds)

        const user = new User({
            ...data,
            userId: counter.sequence,
            password: hashedPassword,
        })
        await user.save()

        const { password: _, userId, email, ...userData } = user.toObject()

        return ApiResponse.created(res, 'User created', {
            user: {
                userId,
                email,
                ...userData,
            },
            token: signToken({ userId, email }),
        })
    } catch (error) {
        next(error)
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = matchedData(req, { locations: ['body'] })

        const user = await User.findOne({ email: email })
        if (!user) return ApiResponse.badRequest(res, `User doesn't exist`)

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) return ApiResponse.unauthorized(res, `Wrong password`)

        return ApiResponse.success(res, 'Successfully logged in', {
            token: signToken({ userId: user.userId, email: user.email }),
        })
    } catch (error) {
        next(error)
    }
}

module.exports = { register, login }
