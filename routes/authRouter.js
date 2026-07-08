const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')

const { createUserSchema, loginSchema } = require('../validation/validationSchemas')
const validateSchema = require('../middleware/validateSchema')

router.post('/register', validateSchema(createUserSchema), authController.register)
router.post('/login', validateSchema(loginSchema), authController.login)

module.exports = router
