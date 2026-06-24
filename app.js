require('dotenv').config()
const mongoose = require('mongoose')
const express = require('express')
const authRouter = require('./routes/authRouter')
const testimonialRouter = require('./routes/testimonialRouter')

mongoose.connect(process.env.MONGODB_URI)
    .then(()=>{
        console.log('Connected to DB')
    })
    .catch(err => console.log(err));

const app = express()
const port = process.env.PORT

app.use(express.json());

app.use('/api/auth', authRouter)
app.use('/api/', testimonialRouter)

app.listen(port, ()=>{
    console.log('App is listening on port ' + port)
})

