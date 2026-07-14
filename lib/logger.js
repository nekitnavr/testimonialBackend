const pino = require('pino')

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    redact: {
        paths: ['req.headers.authorization', 'req.body.password', 'req.body.email', '*.token'],
        censor: '[REDACTED]',
    },
    transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
})

module.exports = logger
