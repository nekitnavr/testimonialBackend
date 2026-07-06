const request = require('supertest')
const app = require('../app')

const {connect, clearDatabase, closeDatabase} = require('./dbSetup')
const User = require('../models/user')

beforeAll(async () => {
    await connect()
})

afterEach(async () => {
    await clearDatabase()
})

afterAll(async () => {
    await closeDatabase()
})

async function registerAndLogin(email = 'owner@test.com'){
    await request(app).post('/api/auth/register').send({
        email,
        password: 'password123',
        businessName: 'Test Biz',
        role: 'owner'
    })

    const loginRes = await request(app).post('/api/auth/login').send({
        email,
        password: 'password123'
    })

    return loginRes.body.data.token
}

describe('POST /api/auth/register', ()=>{
    it('creates a new user', async ()=>{
        const res = await request(app).post('/api/auth/register').send({
            email: 'test@email.com',
            password: 'testPass',
            businessName: 'test company',
            role: 'owner'
        })

        expect(res.status).toBe(201)
        expect(res.body.data.user.email).toBe('test@email.com')
        expect(res.body.data.token).toBeDefined()
        
        const savedUser = await User.findOne({ email: 'test@email.com' })
        expect(savedUser).not.toBeNull()
        expect(savedUser.password).not.toBe('testPass')
    })

    it('rejects duplicate email with 400', async () => {
        await request(app).post('/api/auth/register').send({
            email: 'test@email.com',
            password: 'testPass',
            businessName: 'test company',
            role: 'owner'
        })

        const res = await request(app).post('/api/auth/register').send({
            email: 'test@email.com',
            password: 'testPass2',
            businessName: 'test2 company',
            role: 'owner'
        })

        expect(res.status).toBe(400)
    })
})

describe('POST /api/testimonials', () => {
    it('creates a testimonial for the authenticated user', async () => {
        const token = await registerAndLogin('creator@test.com')

        const res = await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({
                customerName: 'John Doe',
                customerEmail: 'john@customer.com',
                rating: 5,
                text: 'Great service!'
            })

        expect(res.status).toBe(201)
    })

    it('rejects request without auth token', async () => {
        const res = await request(app)
            .post('/api/testimonials')
            .send({ customerName: 'No Auth' })

        expect(res.status).toBe(401)
    })
})

describe('GET /api/testimonials/:testimonialId', () => {
    it('returns the testimonial for its owner', async () => {
        const token = await registerAndLogin('reader@test.com')

        const createRes = await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Jane Doe', rating: 4 })

        const testimonials = await request(app)
            .get('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)

        const testimonialId = testimonials.body.data[0].testimonialId

        const res = await request(app)
            .get(`/api/testimonials/${testimonialId}`)
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(res.body.data.customerName).toBe('Jane Doe')
    })

    it(`returns 403 when accessing another user's testimonial`, async () => {
        const tokenA = await registerAndLogin('userA@test.com')
        const tokenB = await registerAndLogin('userB@test.com')

        await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ customerName: 'Owned by A', rating: 3 })

        const testimonials = await request(app)
            .get('/api/testimonials')
            .set('Authorization', `Bearer ${tokenA}`)

        const testimonialId = testimonials.body.data[0].testimonialId

        const res = await request(app)
            .get(`/api/testimonials/${testimonialId}`)
            .set('Authorization', `Bearer ${tokenB}`)

        expect(res.status).toBe(403)
    })
})

describe('PATCH /api/testimonials/:testimonialId/status', () => {
    it('allows valid status transition', async () => {
        const token = await registerAndLogin('status@test.com')

        await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Status Test', rating: 5 })

        const testimonials = await request(app)
            .get('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)

        const testimonialId = testimonials.body.data[0].testimonialId

        const res = await request(app)
            .patch(`/api/testimonials/${testimonialId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'recording' })

        expect(res.status).toBe(200)
    })

    it('rejects invalid status transition (skipping a step)', async () => {
        const token = await registerAndLogin('badstatus@test.com')

        await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Bad Status Test', rating: 5 })

        const testimonials = await request(app)
            .get('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)

        const testimonialId = testimonials.body.data[0].testimonialId

        const res = await request(app)
            .patch(`/api/testimonials/${testimonialId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'processing' })

        expect(res.status).toBe(400)
    })
})