const { roles } = require('../lib/constants')
const User = require('../models/user')

const createUserSchema = {
    email: { 
        isEmail: {
            errorMessage: 'Invalid email',
        },
        custom: {
            options: async email=>{
                const isDuplicated = await User.exists({email: email})
                if (isDuplicated) throw new Error('User with this email already exists')
            }
        }
    },
    password: { 
        trim: true,
        notEmpty: { errorMessage: 'Password must not be empty' } 
    },
    businessName: { 
        trim: true,
        notEmpty: { errorMessage: 'Business name must not be empty' } 
    },
    role: {
        trim: true,
        custom: {
            options: async role=>{
                if(!roles.includes(role)){
                    throw new Error('Role does not exist');
                }
            }
        }
    },
}

module.exports = {
    createUserSchema
}