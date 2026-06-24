const mongoose = require('mongoose')
const User = require('../models/user')
const emailValidator = require('email-validator')
const bcrypt = require('bcrypt');
const { roles, saltRounds } = require('../lib/constants');
const ApiResponse = require('../lib/apiResponse');
const { signToken } = require('../lib/utils');

async function register(req, res){
    const { 
        email, 
        password, 
        businessName,
        role,
        isActive 
    } = req.body

    
    try {
        if (!emailValidator.validate(email)) throw new Error('Invalid Email')
        const uniqueEmail = await User.findOne({email: email})
        if (uniqueEmail) throw new Error('User with this email already exists')
        if (password == '') throw new Error('Password must be at least one character')
        if (businessName == '') throw new Error('Business must be at least one character')
        if (!roles.includes(role)) throw new Error('Role does not exist')
    } catch (error) {
        return res.status(400).send(ApiResponse.badRequest(error.message))
    }

    const biggestId = await User.find().sort({userId: -1}).limit(1)
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    try {
        const user = new User({
            userId: biggestId[0] ? biggestId[0].userId+1 : 0,
            email: email,
            password: hashedPassword,
            businessName: businessName,
            role: role,
            isActive: isActive
        })
        
        await user.save()

        const {password, ...userData} = user.toObject();

        res.status(201).send(ApiResponse.created('User created', {
            user: userData,
            token: signToken(userData)
        }))
    } catch (error) {
        return res.status(500).send(ApiResponse.failure('Failed to create user'))
    }
}

async function login(req, res){
    const {email, password} = req.body

    const user = await User.findOne({email: email})
    
    try {
        if (!user) throw new Error(`User doesn't exist`)
        if (!bcrypt.compareSync(password, user.password)) throw new Error('Wrong password')
    } catch (error) {
        return res.status(400).send(ApiResponse.badRequest(error.message))        
    }

    res.send(ApiResponse.success('Successfully logged in', {
        token: signToken({userId: user.userId, email: user.email})
    }))
}

module.exports = { register, login}