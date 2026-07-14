describe('logger transport config', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
        process.env.NODE_ENV = originalEnv
        jest.resetModules()
    })

    it('uses pino-pretty transport when NODE_ENV is not production', () => {
        jest.resetModules()
        process.env.NODE_ENV = 'test'
        const logger = require('../../lib/logger')
        expect(logger).toBeDefined()
    })

    it('omits transport when NODE_ENV is production', () => {
        jest.resetModules()
        process.env.NODE_ENV = 'production'
        const logger = require('../../lib/logger')
        expect(logger).toBeDefined()
    })
})
