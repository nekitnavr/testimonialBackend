require('dotenv').config()
require('./lib/checkEnv')()

const mongoose = require('mongoose')
const app = require('./app')

const port = process.env.PORT || 3000

let server

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to DB')

        server = app.listen(port, () => {
            console.log('App is listening on port ' + port)
        })
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB: ', err.message)
        process.exit(1)
    })

function shutdown(signal) {
    console.log(`${signal} received, shutting down gracefully`)

    if (!server) {
        process.exit(0)
    }

    server.close(async () => {
        console.log('HTTP server closed')
        await mongoose.connection.close()
        console.log('MongoDB connection closed')
        process.exit(0)
    })

    setTimeout(() => {
        console.error('Forced shutdown after timeout')
        process.exit(1)
    }, 10000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
