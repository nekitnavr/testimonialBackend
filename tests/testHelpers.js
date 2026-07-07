const request = require('supertest')
const app = require("../app")

async function registerAndLogin(email = 'test@example.com', overrides = {}){
    await request(app).post('/api/auth/register').send({
        email,
        password: 'password123',
        businessName: 'Test Biz',
        role: 'owner',
        ...overrides
    })

    const loginRes = await request(app).post('/api/auth/login').send({
        email,
        password: overrides.password || 'password123'
    })

    return loginRes.body.data.token
}

module.exports = { registerAndLogin }