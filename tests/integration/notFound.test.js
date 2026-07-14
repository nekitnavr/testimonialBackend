const app = require('../../app')
const request = require('supertest')

it('returns a structured 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent-route')

    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({ code: 404, status: 'failure' })
})
