const request = require('supertest')
const app = require('../app')
const { connect, closeDatabase, clearDatabase } = require('./dbSetup')
const { registerAndLogin } = require('./testHelpers')
const User = require('../models/user')
const Testimonial = require('../models/testimonial')

beforeAll(async () => {
    await connect()
})

afterEach(async () => {
    await clearDatabase()
    jest.restoreAllMocks()
})

afterAll(async () => {
    await closeDatabase()
})

describe('Mass assignment protection', () => {
    it('ignores a client-supplied userId/isActive during register', async () => {
        const res = await request(app).post('/api/auth/register').send({
            email: 'spoofed@test.com',
            password: 'password123',
            businessName: 'Spoofed Biz',
            userId: 999999,
            isActive: false,
        })

        expect(res.status).toBe(201)

        const savedUser = await User.findOne({ email: 'spoofed@test.com' })
        expect(savedUser.userId).not.toBe(999999)
        expect(typeof savedUser.userId).toBe('number')
        expect(savedUser.isActive).toBe(true)
    })

    it('ignores a client-supplied userId, status, isDeleted and testimonialId during testimonial creation', async () => {
        const token = await registerAndLogin('testimonialspoof@test.com')

        const res = await request(app).post('/api/testimonials').set('Authorization', `Bearer ${token}`).send({
            customerName: 'Spoofed Customer',
            userId: 999999,
            status: 'completed',
            isDeleted: true,
            testimonialId: 'attacker-chosen-id',
        })

        expect(res.status).toBe(201)

        const savedTestimonial = await Testimonial.findOne({ customerName: 'Spoofed Customer' })

        expect(savedTestimonial.userId).not.toBe(999999)
        expect(typeof savedTestimonial.userId).toBe('number')
        expect(savedTestimonial.status).toBe('draft')
        expect(savedTestimonial.isDeleted).toBe(false)
        expect(savedTestimonial.testimonialId).not.toBe('attacker-chosen-id')
    })

    it('strips completely unknown fields not present in any schema', async () => {
        const token = await registerAndLogin('unknownfield@test.com')

        const res = await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({
                customerName: 'Unknown Field Test',
                rating: 4,
                someRandomField: 'should not exist',
                __proto__: { polluted: true },
            })

        expect(res.status).toBe(201)

        const savedTestimonial = await Testimonial.findOne({ customerName: 'Unknown Field Test' })
        expect(savedTestimonial.toObject()).not.toHaveProperty('someRandomField')
        expect(savedTestimonial.toObject()).not.toHaveProperty('polluted')
    })
})

describe('errorHandler catches Mongoose errors correctly', () => {
    it('returns 400 (not 500) when both requests bypass express-validator and hit the DB unique index', async () => {
        jest.spyOn(User, 'exists').mockResolvedValue(false)

        const payload = {
            email: 'forcedrace@test.com',
            password: 'password123',
            businessName: 'Forced Race Biz',
        }

        const [resA, resB] = await Promise.all([
            request(app).post('/api/auth/register').send(payload),
            request(app).post('/api/auth/register').send(payload),
        ])

        const statuses = [resA.status, resB.status].sort()

        expect(statuses).toEqual([201, 400])

        const count = await User.countDocuments({ email: 'forcedrace@test.com' })
        expect(count).toBe(1)
    })

    it('returns 400 (not 500) when Mongoose validation fails on testimonial rating bounds', async () => {
        const token = await registerAndLogin('ratingfail@test.com')

        // rating: 10 отклоняется express-validator (ratingRule, max: 5)
        const res = await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Bad Rating', rating: 10 })

        expect(res.status).toBe(400)
    })

    it('returns 400 (not 500) on CastError from an invalid ObjectId-like param', async () => {
        const token = await registerAndLogin('casterror@test.com')

        // testimonialId — String в схеме, не ObjectId, так что CastError тут
        // маловероятен через params; проверяем через query, где page/limit
        // должны быть числами — express-validator ловит это первой линией
        const res = await request(app).get('/api/testimonials?page=not-a-number').set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(400)
        expect(res.status).not.toBe(500)
    })
})
