const request = require('supertest')
const app = require('../app')

const {connect, clearDatabase, closeDatabase} = require('./dbSetup')
const User = require('../models/user')
const { registerAndLogin, createAndDelete } = require('./testHelpers')

beforeAll(async () => {
    await connect()
})

afterEach(async () => {
    await clearDatabase()
})

afterAll(async () => {
    await closeDatabase()
})

describe('POST /api/testimonials', () => {
    it('creates a testimonial for the authenticated user', async () => {
        const token = await registerAndLogin('creator@test.com')

        const res = await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({
                customerName: 'John Doe',
                customerEmail: 'john@customer.com',
                rating: 5,
                text: 'Great service!'
            })

        expect(res.status).toBe(201)
    })

    it('rejects request without auth token', async () => {
        const res = await request(app)
            .post('/api/testimonials')
            .send({ customerName: 'No Auth' })

        expect(res.status).toBe(401)
    })
})

describe('GET /api/testimonials/:testimonialId', () => {
    it('returns the testimonial for its owner', async () => {
        const token = await registerAndLogin('reader@test.com')

        const createRes = await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Jane Doe' })

        const testimonials = await request(app)
            .get('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)

        const testimonialId = testimonials.body.data[0].testimonialId

        const res = await request(app)
            .get(`/api/testimonials/${testimonialId}`)
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(res.body.data.customerName).toBe('Jane Doe')
    })

    it(`returns 403 when accessing another user's testimonial`, async () => {
        const tokenA = await registerAndLogin('userA@test.com')
        const tokenB = await registerAndLogin('userB@test.com')

        await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ customerName: 'Owned by A' })

        const testimonials = await request(app)
            .get('/api/testimonials')
            .set('Authorization', `Bearer ${tokenA}`)

        const testimonialId = testimonials.body.data[0].testimonialId

        const res = await request(app)
            .get(`/api/testimonials/${testimonialId}`)
            .set('Authorization', `Bearer ${tokenB}`)

        expect(res.status).toBe(403)
    })
})

describe('PATCH /api/testimonials/:testimonialId/status', () => {
    it('allows valid status transition', async () => {
        const token = await registerAndLogin('status@test.com')

        await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Status Test' })

        const testimonials = await request(app)
            .get('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)

        const testimonialId = testimonials.body.data[0].testimonialId

        const res = await request(app)
            .patch(`/api/testimonials/${testimonialId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'recording' })

        expect(res.status).toBe(200)
    })

    it('rejects invalid status transition (skipping a step)', async () => {
        const token = await registerAndLogin('badstatus@test.com')

        await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Bad Status Test' })

        const testimonials = await request(app)
            .get('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)

        const testimonialId = testimonials.body.data[0].testimonialId

        const res = await request(app)
            .patch(`/api/testimonials/${testimonialId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'processing' })

        expect(res.status).toBe(400)
    })
})

describe('DELETE /api/testimonials/:testimonialId', ()=>{
    it('deletes an existing testimonial', async ()=>{
        const token = await registerAndLogin('test@email.com')

        await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Status Test' })
        
        const testimonials = await request(app)
            .get('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)

        const testimonialId = testimonials.body.data[0].testimonialId

        const res = await request(app)
            .delete(`/api/testimonials/${testimonialId}`)
            .set('Authorization', `Bearer ${token}`)

        const getRes = await request(app)
            .get(`/api/testimonials/${testimonialId}`)
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(getRes.status).toBe(404)
    })

    it(`returns 403 when deleting another user's testimonial`, async () => {
        const tokenA = await registerAndLogin('ownerA@test.com')
        const tokenB = await registerAndLogin('ownerB@test.com')

        await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ customerName: 'Owned by A' })

        const testimonials = await request(app)
            .get('/api/testimonials')
            .set('Authorization', `Bearer ${tokenA}`)

        const testimonialId = testimonials.body.data[0].testimonialId

        const res = await request(app)
            .delete(`/api/testimonials/${testimonialId}`)
            .set('Authorization', `Bearer ${tokenB}`)

        expect(res.status).toBe(403)
    })
})

describe('POST /api/testimonials/:testimonialId/share', () => {
    it('rejects sharing a testimonial that is still in draft', async () => {
        const token = await registerAndLogin('sharedraft@test.com')

        await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Draft Share Test' })

        const listRes = await request(app)
            .get('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)

        const testimonialId = listRes.body.data[0].testimonialId

        const res = await request(app)
            .post(`/api/testimonials/${testimonialId}/share`)
            .set('Authorization', `Bearer ${token}`)
            .send({ channels: ['email'] })

        expect(res.status).toBe(400)
    })
})

describe('GET /api/testimonials (pagination and filters)', () => {
    async function createTestimonials(token, count){
        for (let i = 0; i < count; i++) {
            await request(app)
                .post('/api/testimonials')
                .set('Authorization', `Bearer ${token}`)
                .send({ customerName: `Customer ${i}` })
        }
    }

    it('paginates results according to page and limit', async () => {
        const token = await registerAndLogin('paginationowner@test.com')
        await createTestimonials(token, 5)

        const res = await request(app)
            .get('/api/testimonials?page=1&limit=2')
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(res.body.data).toHaveLength(2)
        expect(res.body.pagination).toMatchObject({
            total: 5,
            page: 1,
            limit: 2,
            pages: 3
        })
    })

    it('returns the second page with remaining items', async () => {
        const token = await registerAndLogin('page2owner@test.com')
        await createTestimonials(token, 5)

        const res = await request(app)
            .get('/api/testimonials?page=3&limit=2')
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(res.body.data).toHaveLength(1)
    })

    it('filters testimonials by status', async () => {
        const token = await registerAndLogin('statusfilter@test.com')

        await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Still Draft' })

        const listRes = await request(app)
            .get('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)

        const testimonialId = listRes.body.data[0].testimonialId

        await request(app)
            .patch(`/api/testimonials/${testimonialId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'recording' })

        const draftRes = await request(app)
            .get('/api/testimonials?status=draft')
            .set('Authorization', `Bearer ${token}`)

        const recordingRes = await request(app)
            .get('/api/testimonials?status=recording')
            .set('Authorization', `Bearer ${token}`)

        expect(draftRes.body.data).toHaveLength(0)
        expect(recordingRes.body.data).toHaveLength(1)
    })

    it('rejects an invalid sort field', async () => {
        const token = await registerAndLogin('badsort@test.com')

        const res = await request(app)
            .get('/api/testimonials?sort=password')
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(400)
    })
})

describe('Soft-deleted testimonial access', () => {
    it('returns 404 on GET for a soft-deleted testimonial', async () => {
        const token = await registerAndLogin('softget@test.com')
        const testimonialId = await createAndDelete(token)

        const res = await request(app)
            .get(`/api/testimonials/${testimonialId}`)
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(404)
    })

    it('returns 404 on PUT update for a soft-deleted testimonial', async () => {
        const token = await registerAndLogin('softupdate@test.com')
        const testimonialId = await createAndDelete(token)

        const res = await request(app)
            .put(`/api/testimonials/${testimonialId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Should not apply' })

        expect(res.status).toBe(404)
    })

    it('returns 404 on share for a soft-deleted testimonial', async () => {
        const token = await registerAndLogin('softshare@test.com')
        const testimonialId = await createAndDelete(token)

        const res = await request(app)
            .post(`/api/testimonials/${testimonialId}/share`)
            .set('Authorization', `Bearer ${token}`)
            .send({ channels: ['email'] })

        expect(res.status).toBe(404)
    })
})