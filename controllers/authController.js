const mongoose = require('mongoose')
const User = require('../models/user')
const emailValidator = require('email-validator')
const bcrypt = require('bcrypt');
const saltRounds = 10;

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
    } catch (error) {
        return res.send(error.message)
    }
    

    const biggestId = await User.find().sort({userId: -1}).limit(1).exec()
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
    res.send()
}

function login(){

}

module.exports = { register, login}