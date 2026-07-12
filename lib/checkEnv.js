const { requiredEnvs } = require('./constants')
const logger = require('./logger')

module.exports = function checkEnv() {
    const missing = requiredEnvs.filter((key) => !process.env[key])

    if (missing.length > 0) {
        logger.error(`Missing required environment variables: ${missing.join(', ')}`)
        process.exit(1)
    }
}
