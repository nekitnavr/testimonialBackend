const request = require('supertest')
const app = require('../app')

const { connect, clearDatabase, closeDatabase } = require('./dbSetup')
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

describe('POST /api/auth/register', () => {
    it('creates a new user', async () => {
        const res = await request(app).post('/api/auth/register').send({
            email: 'test@email.com',
            password: 'testPass',
            businessName: 'test company',
            role: 'owner',
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
            role: 'owner',
        })

        const res = await request(app).post('/api/auth/register').send({
            email: 'test@email.com',
            password: 'testPass2',
            businessName: 'test2 company',
            role: 'owner',
        })

        expect(res.status).toBe(400)
    })

    it('registers successfully without role and defaults to owner', async () => {
        const res = await request(app).post('/api/auth/register').send({
            email: 'norole@test.com',
            password: 'password123',
            businessName: 'No Role Biz',
        })

        expect(res.status).toBe(201)

        const User = require('../models/user')
        const savedUser = await User.findOne({ email: 'norole@test.com' })
        expect(savedUser.role).toBe('owner')
    })
})
