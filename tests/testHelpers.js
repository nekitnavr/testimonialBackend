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

async function createAndDelete(token){
    await request(app)
        .post('/api/testimonials')
        .set('Authorization', `Bearer ${token}`)
        .send({ customerName: 'Soon Deleted' })

    const listRes = await request(app)
        .get('/api/testimonials')
        .set('Authorization', `Bearer ${token}`)

    const testimonialId = listRes.body.data[0].testimonialId

    await request(app)
        .delete(`/api/testimonials/${testimonialId}`)
        .set('Authorization', `Bearer ${token}`)

    return testimonialId
}

module.exports = { 
    registerAndLogin,
    createAndDelete
}