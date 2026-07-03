const mongoose = require('mongoose')
const User = require('../models/user')
const bcrypt = require('bcrypt');
const { roles, saltRounds } = require('../lib/constants');
const ApiResponse = require('../lib/apiResponse');
const { signToken } = require('../lib/utils');
const { validationResult } = require('express-validator');
const Counter = require('../models/counter');

async function register(req, res){
    try {
        const { 
            password, 
            ...data 
        } = req.body

        const counter = await Counter.findOneAndUpdate({counterName: 'userId'}, {$inc: {sequence: 1}}, {upsert: true})
        const hashedPassword = await bcrypt.hash(password, saltRounds)
    
        const user = new User({
            userId: counter.sequence,
            password: hashedPassword,
            ...data
        })
        await user.save()

        const {password:_, ...userData} = user.toObject();

        return ApiResponse.created(res, 'User created', {
            user: userData,
            token: signToken(userData)
        })
    } catch (error) {
        console.error(error)
        return ApiResponse.failure(res, 'Failed to create user')
    }
}

async function login(req, res){
    try {
        const {email, password} = req.body

        const user = await User.findOne({email: email})
        if (!user) return ApiResponse.badRequest(res, `User doesn't exist`)

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) return ApiResponse.unauthorized(res, `Wrong password`)
            
        return ApiResponse.success(res, 'Successfully logged in', {
            token: signToken({userId: user.userId, email: user.email})
        })
    } catch (error) {
        console.error(error)
        return ApiResponse.failure(res, 'Login failed')
    }
}

module.exports = { register, login}