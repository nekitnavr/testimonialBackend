const jwt = require('jsonwebtoken')
const auth = require('../middleware/auth')
const { signToken } = require('../lib/utils')

function mockRes() {
    return {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
    }
}

const mockUser = { userId: 1, email: 'test@email.com' }

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

    it('allows request with valid token and attaches user', () => {
        const validToken = signToken(mockUser)

        const req = { headers: { authorization: `Bearer ${validToken}` } }
        const res = mockRes()
        const next = jest.fn()

        auth(req, res, next)

        expect(req.user).toMatchObject(mockUser)
        expect(res.status).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalled()
    })
})
