require('dotenv').config()
const mongoose = require('mongoose')
const express = require('express')
const authRouter = require('./routes/authRouter')
const testimonialRouter = require('./routes/testimonialRouter')
const auth = require('./middleware/auth')
const rateLimit = require('express-rate-limit')
const ApiResponse = require('./lib/apiResponse')
const errorHandler = require('./middleware/errorHandler')

mongoose.connect(process.env.MONGODB_URI)
    .then(()=>{
        console.log('Connected to DB')
    })
    .catch(err => console.log(err));

const app = express()
const port = process.env.PORT

app.use(express.json());

const limiter = rateLimit({
	windowMs: 60 * 1000,
	limit: 5,
	standardHeaders: true,
	legacyHeaders: false,
    message: new ApiResponse(429, 'failure', 'Too many requests, please try again later.'),
})

app.use('/api/auth', limiter, authRouter)
app.use('/api/testimonials', auth, testimonialRouter)

app.use(errorHandler)

app.listen(port, ()=>{
    console.log('App is listening on port ' + port)
})

