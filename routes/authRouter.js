const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')

const { createUserSchema } = require('../lib/validationSchemas')
const validateSchema = require('../middleware/validateSchema')

router.post('/register', validateSchema(createUserSchema), authController.register)
router.post('/login', authController.login)

module.exports = router