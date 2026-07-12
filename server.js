require('dotenv').config()
require('./lib/checkEnv')()

const mongoose = require('mongoose')
const app = require('./app')
const logger = require('./lib/logger')

const port = process.env.PORT || 3000

let server

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        logger.info('Connected to DB')

        server = app.listen(port, () => {
            logger.info('App is listening on port ' + port)
        })
    })
    .catch((err) => {
        logger.error({ err }, 'Failed to connect to MongoDB: ')
        process.exit(1)
    })

function shutdown(signal) {
    logger.info(`${signal} received, shutting down gracefully`)

    if (!server) {
        process.exit(0)
    }

    server.close(async () => {
        logger.info('HTTP server closed')
        await mongoose.connection.close()
        logger.info('MongoDB connection closed')
        process.exit(0)
    })

    setTimeout(() => {
        logger.error('Forced shutdown after timeout')
        process.exit(1)
    }, 10000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
