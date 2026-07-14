const express = require('express')
const authRouter = require('./routes/authRouter')
const testimonialRouter = require('./routes/testimonialRouter')
const auth = require('./middleware/auth')
const rateLimit = require('express-rate-limit')
const ApiResponse = require('./lib/apiResponse')
const errorHandler = require('./middleware/errorHandler')
const notFoundHandler = require('./middleware/notFoundHandler')
const pinoHttp = require('pino-http')
const { randomUUID } = require('node:crypto')
const logger = require('./lib/logger')

const app = express()

app.use(express.json())

const limiter = rateLimit({
    windowMs: 60 * 1000,
    limit: process.env.NODE_ENV === 'test' ? 10000 : 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: new ApiResponse(429, 'failure', 'Too many requests, please try again later.'),
})

app.use(pinoHttp({ logger, genReqId: (req) => req.headers['x-request-id'] || randomUUID() }))

app.use('/api/auth', limiter, authRouter)
app.use('/api/testimonials', auth, testimonialRouter)

app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app
