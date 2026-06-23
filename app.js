require('dotenv').config()
const mongoose = require('mongoose')
const express = require('express')

// async function main() {
//     await mongoose.connect('mongodb://127.0.0.1:27017/TestimonialsDB');
//     console.log('Connected to DB')
// }
// main().catch(err => console.log(err));
mongoose.connect('mongodb://127.0.0.1:27017/TestimonialsDB')
    .then(()=>{
        console.log('Connected to DB')
    })
    .catch(err => console.log(err));

const app = express()
const port = process.env.PORT

app.listen(port, ()=>{
    console.log('App is listening on port ' + port)
})
// const User = require('./models/user')
// const user = new User({
//     userId: 1,
//     email: '1memail.com',
//     password: '123',
//     businessName: 'company',
//     role: 'nerd',
//     isActive: false
// })

// user.save().then(()=>{console.log('User created')})
