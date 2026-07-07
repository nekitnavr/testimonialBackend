const request = require('supertest')
const app = require('../app')
const { connect, closeDatabase, clearDatabase } = require('./dbSetup')
const { registerAndLogin } = require('./testHelpers')

beforeAll(async () => {
    await connect()
})

afterEach(async () => {
    await clearDatabase()
})

afterAll(async () => {
    await closeDatabase()
})

describe('GET /api/testimonials/analytics', () => {
    it('returns overview with total and average rating for the authenticated user', async () => {
        const token = await registerAndLogin('owner1@test.com')

        await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Customer One', rating: 4 })

        await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Customer Two', rating: 2 })

        const res = await request(app)
            .get('/api/testimonials/analytics')
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(res.body.data.overview.total).toBe(2)
        expect(res.body.data.overview.averageRating).toBe(3)
        expect(res.body.data.overview.byStatus.draft).toBe(2)
    })

    it('only counts testimonials belonging to the authenticated user', async () => {
        const tokenA = await registerAndLogin('ownerA@test.com')
        const tokenB = await registerAndLogin('ownerB@test.com')

        await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ customerName: 'Owned by A', rating: 5 })

        await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ customerName: 'Owned by A', rating: 3 })

        await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ customerName: 'Owned by B', rating: 1 })

        const res = await request(app)
            .get('/api/testimonials/analytics')
            .set('Authorization', `Bearer ${tokenA}`)

        expect(res.status).toBe(200)
        expect(res.body.data.overview.total).toBe(2)
        expect(res.body.data.overview.averageRating).toBe(4)
    })

    it('excludes soft-deleted testimonials from the overview', async () => {
        const token = await registerAndLogin('softdelete@test.com')

        await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'To be deleted', rating: 3 })

        await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'To be deleted', rating: 2 })

        const listRes = await request(app)
            .get('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)

        const testimonialId = listRes.body.data[0].testimonialId

        await request(app)
            .delete(`/api/testimonials/${testimonialId}`)
            .set('Authorization', `Bearer ${token}`)

        const res = await request(app)
            .get('/api/testimonials/analytics')
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(res.body.data.overview.total).toBe(1)
    })

    it('returns 400 for an invalid date format', async () => {
        const token = await registerAndLogin('baddate@test.com')

        const res = await request(app)
            .get('/api/testimonials/analytics?startDate=not-a-date')
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(400)
    })

    it('filters testimonials by date range', async () => {
        const token = await registerAndLogin('daterange@test.com')

        await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Created now', rating: 5 })

        const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

        const res = await request(app)
            .get(`/api/testimonials/analytics?startDate=${futureStart}`)
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(res.body.data.overview.total).toBe(0)
    })
})