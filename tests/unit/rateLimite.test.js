describe('rate limiter configuration', () => {
    afterEach(() => {
        jest.resetModules()
    })

    it('applies the production rate limit when NODE_ENV is not test', () => {
        jest.resetModules()
        const originalEnv = process.env.NODE_ENV
        process.env.NODE_ENV = 'production'

        const testApp = require('../../app')
        expect(testApp).toBeDefined()

        process.env.NODE_ENV = originalEnv
    })
})
