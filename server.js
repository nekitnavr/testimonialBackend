require('dotenv').config()
require('./lib/checkEnv')()

const mongoose = require('mongoose')
const app = require('./app')

const port = process.env.PORT || 3000

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to DB')

        app.listen(port, () => {
            console.log('App is listening on port ' + port)
        })
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB: ', err.message)
        process.exit(1)
    })
