const User = require('../models/user')
const bcrypt = require('bcrypt')
const { saltRounds } = require('../lib/constants')
const { signToken } = require('../lib/utils')
const Counter = require('../models/counter')
const AppError = require('../lib/appError')

/**
 * @returns {Object} {user, token}
 */
async function registerUser({ email, businessName, role, password }) {
    const counter = await Counter.findOneAndUpdate(
        { counterName: 'userId' },
        { $inc: { sequence: 1 } },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    )
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    const user = new User({
        email,
        businessName,
        role,
        userId: counter.sequence,
        password: hashedPassword,
    })
    await user.save()

    return {
        user: { userId: user.userId, email: user.email },
        token: signToken({ userId: user.userId, email: user.email }),
    }
}

/**
 *
 * @returns {Object} {token}
 */
async function loginUser({ email, password }) {
    const user = await User.findOne({ email })
    if (!user) throw new AppError(`User doesn't exist`, 400)

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) throw new AppError('Wrong password', 401)

    return { token: signToken({ userId: user.userId, email: user.email }) }
}

module.exports = {
    registerUser,
    loginUser,
}
