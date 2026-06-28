const mongoose = require('mongoose')
const User = require('../models/user')
const emailValidator = require('email-validator')
const bcrypt = require('bcrypt');
const { roles, saltRounds } = require('../lib/constants');
const ApiResponse = require('../lib/apiResponse');
const { signToken } = require('../lib/utils');

async function register(req, res){
    try {
        const { 
            email, 
            password, 
            businessName,
            role,
            isActive 
        } = req.body
        
        if (!password || !businessName) return ApiResponse.badRequest(res, 'Password and Business Name must be at least one character')
        if (!emailValidator.validate(email)) return ApiResponse.badRequest(res, 'Invalid Email')
        if (!roles.includes(role)) return ApiResponse.badRequest(res, 'Role does not exist')
        const isDuplicated = await User.exists({email: email})
        if (isDuplicated) return ApiResponse.badRequest(res, 'User with this email already exists')

        const biggestId = await User.find().sort({userId: -1}).limit(1)
        const hashedPassword = await bcrypt.hash(password, saltRounds)
    
        const user = new User({
            userId: biggestId[0] ? biggestId[0].userId+1 : 0,
            email: email,
            password: hashedPassword,
            businessName: businessName,
            role: role,
            isActive: isActive
        })
        
        await user.save()

        const {password:_, ...userData} = user.toObject();

        return res.status(201).send(ApiResponse.created('User created', {
            user: userData,
            token: signToken(userData)
        }))
    } catch (error) {
        console.error(error)
        return ApiResponse.failure(res, 'Failed to create user')
    }
}

async function login(req, res){
    try {
        const {email, password} = req.body
        if (!email || !password) return ApiResponse.badRequest(res, 'Email and password are required')

        const user = await User.findOne({email: email})
        if (!user) return ApiResponse.badRequest(res, `User doesn't exist`)

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) return ApiResponse.unauthorized(res, `Wrong password`)
            
        return res.send(ApiResponse.success('Successfully logged in', {
            token: signToken({userId: user.userId, email: user.email})
        }))
    } catch (error) {
        console.error(error)
        return ApiResponse.failure(res, 'Login failed')
    }
}

module.exports = { register, login}