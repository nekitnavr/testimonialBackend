const { checkSchema, validationResult } = require('express-validator')
const ApiResponse = require('../lib/apiResponse')

module.exports = (schema)=>{
    return [
        checkSchema(schema), 
        (req,res,next)=>{
            const result = validationResult(req)        
            if (!result.isEmpty()) return ApiResponse.badRequest(res, result.errors[0].msg)
            next()
        }
    ]
}