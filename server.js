require('dotenv').config()
require('./lib/checkEnv')()

const mongoose = require('mongoose')
const app = require('./app')

const port = process.env.PORT || 3000

mongoose.connect(process.env.MONGODB_URI)
    .then(()=>{
        console.log('Connected to DB')
    })
    .catch(err => console.log(err));

app.listen(port, ()=>{
    console.log('App is listening on port ' + port)
})