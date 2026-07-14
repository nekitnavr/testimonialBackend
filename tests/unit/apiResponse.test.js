const ApiResponse = require('../../lib/apiResponse')

describe('ApiResponse static methods', () => {
    function mockRes() {
        return { status: jest.fn().mockReturnThis(), send: jest.fn() }
    }

    it('creates a response', () => {
        const response = new ApiResponse()
        expect(response).toMatchObject({ code: 200, status: 'success', message: '' })
    })

    it('success() sends 200', () => {
        const res = mockRes()
        ApiResponse.success(res, 'Nice')
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ code: 200, status: 'success', message: 'Nice', data: {} }))
    })

    it('success() uses default empty message and data when not provided', () => {
        const res = mockRes()
        ApiResponse.success(res)
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: '', data: {} }))
    })

    it('created() sends 201', () => {
        const res = mockRes()
        ApiResponse.created(res, 'Created!', { id: 1 })
        expect(res.status).toHaveBeenCalledWith(201)
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({ code: 201, status: 'success', message: 'Created!', data: { id: 1 } }),
        )
    })

    it('created() uses default empty message and data when not provided', () => {
        const res = mockRes()
        ApiResponse.created(res)
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: '', data: {} }))
    })

    it('failure() defaults to 500 when no code is given', () => {
        const res = mockRes()
        ApiResponse.failure(res, 'Something broke')
        expect(res.status).toHaveBeenCalledWith(500)
    })

    it('failure() uses an explicitly provided code', () => {
        const res = mockRes()
        ApiResponse.failure(res, 'Custom failure', 503)
        expect(res.status).toHaveBeenCalledWith(503)
    })

    it('failure() uses default empty message when not provided', () => {
        const res = mockRes()
        ApiResponse.failure(res)
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: '' }))
    })

    it('badRequest() sends 400', () => {
        const res = mockRes()
        ApiResponse.badRequest(res, 'bad input')
        expect(res.status).toHaveBeenCalledWith(400)
    })

    it('badRequest() uses default empty message when not provided', () => {
        const res = mockRes()
        ApiResponse.badRequest(res)
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ code: 400, status: 'failure', message: '' }))
    })

    it('unauthorized() sends 401', () => {
        const res = mockRes()
        ApiResponse.unauthorized(res, 'no access')
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ code: 401, status: 'failure', message: 'no access' }))
    })

    it('unauthorized() uses default empty message when not provided', () => {
        const res = mockRes()
        ApiResponse.unauthorized(res)
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ code: 401, status: 'failure', message: '' }))
    })

    it('forbidden() sends 403', () => {
        const res = mockRes()
        ApiResponse.forbidden(res, 'blocked')
        expect(res.status).toHaveBeenCalledWith(403)
    })

    it('forbidden() uses default empty message when not provided', () => {
        const res = mockRes()
        ApiResponse.forbidden(res)
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ code: 403, status: 'failure', message: '' }))
    })

    it('notFound() sends 404', () => {
        const res = mockRes()
        ApiResponse.notFound(res, 'missing')
        expect(res.status).toHaveBeenCalledWith(404)
    })

    it('notFound() uses default empty message when not provided', () => {
        const res = mockRes()
        ApiResponse.notFound(res)
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ code: 404, status: 'failure', message: '' }))
    })

    it('constructor omits data field when data is undefined', () => {
        const response = new ApiResponse(200, 'success', 'ok')
        expect(response).not.toHaveProperty('data')
    })

    it('constructor includes data field when data is null', () => {
        const response = new ApiResponse(200, 'success', 'ok', null)
        expect(response).toHaveProperty('data', null)
    })
})
