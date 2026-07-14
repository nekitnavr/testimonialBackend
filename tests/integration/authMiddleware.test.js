const request = require('supertest')
const app = require('../../app')
const jwt = require('jsonwebtoken')
const auth = require('../../middleware/auth')
const { connect, closeDatabase, clearDatabase } = require('./setup/dbSetup')
const { registerAndLogin } = require('./setup/testHelpers')
const User = require('../../models/user')

function mockRes() {
    return {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
    }
}

const mockUser = { userId: 1, email: 'test@email.com' }

beforeAll(async () => {
    await connect()
})

afterEach(async () => {
    await clearDatabase()
})

afterAll(async () => {
    await closeDatabase()
})

describe('auth middleware', () => {
    it('rejects request beacause no authorization header', () => {
        const req = { headers: {} }
        const res = mockRes()
        const next = jest.fn()

        auth(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(next).not.toHaveBeenCalled()
    })

    it('rejects request beacause invalid authorization header', () => {
        const req = { headers: { authorization: 'Bearer badToken' } }
        const res = mockRes()
        const next = jest.fn()

        auth(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(next).not.toHaveBeenCalled()
    })

    it('rejects an expired token', () => {
        const expiredToken = jwt.sign(mockUser, process.env.JWT_SECRET, { expiresIn: -10 })

        const req = { headers: { authorization: `Bearer ${expiredToken}` } }
        const res = mockRes()
        const next = jest.fn()

        auth(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(next).not.toHaveBeenCalled()
    })

    it('allows request with valid token and attaches user', async () => {
        const token = await registerAndLogin(mockUser.email)

        const req = { headers: { authorization: `Bearer ${token}` } }
        const res = mockRes()
        const next = jest.fn()

        await auth(req, res, next)

        expect(req.user).toMatchObject(mockUser)
        expect(res.status).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalled()
    })

    it('rejects requests from a deactivated user even with a valid token', async () => {
        const token = await registerAndLogin('deactivated@test.com')

        await User.findOneAndUpdate({ email: 'deactivated@test.com' }, { isActive: false })

        const res = await request(app).get('/api/testimonials').set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(401)
    })
})
