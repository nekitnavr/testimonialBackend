const AppError = require('../../lib/appError')

describe('AppError', () => {
    it('defaults statusCode to 400 when not provided', () => {
        const error = new AppError('Something went wrong')
        expect(error.statusCode).toBe(400)
    })

    it('uses the provided statusCode when given', () => {
        const error = new AppError('Forbidden', 403)
        expect(error.statusCode).toBe(403)
    })
})
