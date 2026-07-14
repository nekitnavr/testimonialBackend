const mongoose = require('mongoose')

const counterSchema = new mongoose.Schema({
    counterName: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    sequence: {
        type: Number,
        default: 0,
    },
})

const Counter = mongoose.model('Counter', counterSchema)
module.exports = Counter
