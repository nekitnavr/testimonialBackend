const { requiredEnvs } = require('./constants')

module.exports = function checkEnv() {
    const missing = requiredEnvs.filter((key) => !process.env[key])

    if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.join(', ')}`)
        process.exit(1)
    }
}
