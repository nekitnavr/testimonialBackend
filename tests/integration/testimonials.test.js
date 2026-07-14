const request = require('supertest')
const app = require('../../app')

const { connect, clearDatabase, closeDatabase } = require('./setup/dbSetup')
const { registerAndLogin, createAndDelete } = require('./setup/testHelpers')

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

        const res = await request(app).post('/api/testimonials').set('Authorization', `Bearer ${token}`).send({
            customerName: 'John Doe',
            customerEmail: 'john@customer.com',
            rating: 5,
            text: 'Great service!',
        })

        expect(res.status).toBe(201)
    })

    it('rejects request without auth token', async () => {
        const res = await request(app).post('/api/testimonials').send({ customerName: 'No Auth' })

        expect(res.status).toBe(401)
    })
})

describe('GET /api/testimonials/:testimonialId', () => {
    it('returns the testimonial for its owner', async () => {
        const token = await registerAndLogin('reader@test.com')

        await request(app).post('/api/testimonials').set('Authorization', `Bearer ${token}`).send({ customerName: 'Jane Doe' })

        const testimonials = await request(app).get('/api/testimonials').set('Authorization', `Bearer ${token}`)

        const testimonialId = testimonials.body.data[0].testimonialId

        const res = await request(app).get(`/api/testimonials/${testimonialId}`).set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(res.body.data.customerName).toBe('Jane Doe')
    })

    it(`returns 403 when accessing another user's testimonial`, async () => {
        const tokenA = await registerAndLogin('userA@test.com')
        const tokenB = await registerAndLogin('userB@test.com')

        await request(app).post('/api/testimonials').set('Authorization', `Bearer ${tokenA}`).send({ customerName: 'Owned by A' })

        const testimonials = await request(app).get('/api/testimonials').set('Authorization', `Bearer ${tokenA}`)

        const testimonialId = testimonials.body.data[0].testimonialId

        const res = await request(app).get(`/api/testimonials/${testimonialId}`).set('Authorization', `Bearer ${tokenB}`)

        expect(res.status).toBe(403)
    })
})

describe('PATCH /api/testimonials/:testimonialId/status', () => {
    it('allows valid status transition', async () => {
        const token = await registerAndLogin('status@test.com')

        await request(app).post('/api/testimonials').set('Authorization', `Bearer ${token}`).send({ customerName: 'Status Test' })

        const testimonials = await request(app).get('/api/testimonials').set('Authorization', `Bearer ${token}`)

        const testimonialId = testimonials.body.data[0].testimonialId

        const res = await request(app)
            .patch(`/api/testimonials/${testimonialId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'recording' })

        expect(res.status).toBe(200)
    })

    it('rejects invalid status transition (skipping a step)', async () => {
        const token = await registerAndLogin('badstatus@test.com')

        await request(app).post('/api/testimonials').set('Authorization', `Bearer ${token}`).send({ customerName: 'Bad Status Test' })

        const testimonials = await request(app).get('/api/testimonials').set('Authorization', `Bearer ${token}`)

        const testimonialId = testimonials.body.data[0].testimonialId

        const res = await request(app)
            .patch(`/api/testimonials/${testimonialId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'processing' })

        expect(res.status).toBe(400)
    })
})

describe('DELETE /api/testimonials/:testimonialId', () => {
    it('deletes an existing testimonial', async () => {
        const token = await registerAndLogin('test@email.com')

        await request(app).post('/api/testimonials').set('Authorization', `Bearer ${token}`).send({ customerName: 'Status Test' })

        const testimonials = await request(app).get('/api/testimonials').set('Authorization', `Bearer ${token}`)

        const testimonialId = testimonials.body.data[0].testimonialId

        const res = await request(app).delete(`/api/testimonials/${testimonialId}`).set('Authorization', `Bearer ${token}`)

        const getRes = await request(app).get(`/api/testimonials/${testimonialId}`).set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(getRes.status).toBe(404)
    })

    it(`returns 403 when deleting another user's testimonial`, async () => {
        const tokenA = await registerAndLogin('ownerA@test.com')
        const tokenB = await registerAndLogin('ownerB@test.com')

        await request(app).post('/api/testimonials').set('Authorization', `Bearer ${tokenA}`).send({ customerName: 'Owned by A' })

        const testimonials = await request(app).get('/api/testimonials').set('Authorization', `Bearer ${tokenA}`)

        const testimonialId = testimonials.body.data[0].testimonialId

        const res = await request(app).delete(`/api/testimonials/${testimonialId}`).set('Authorization', `Bearer ${tokenB}`)

        expect(res.status).toBe(403)
    })
})

describe('POST /api/testimonials/:testimonialId/share', () => {
    it('rejects sharing a testimonial that is still in draft', async () => {
        const token = await registerAndLogin('sharedraft@test.com')

        await request(app).post('/api/testimonials').set('Authorization', `Bearer ${token}`).send({ customerName: 'Draft Share Test' })

        const listRes = await request(app).get('/api/testimonials').set('Authorization', `Bearer ${token}`)

        const testimonialId = listRes.body.data[0].testimonialId

        const res = await request(app)
            .post(`/api/testimonials/${testimonialId}/share`)
            .set('Authorization', `Bearer ${token}`)
            .send({ channels: ['email'] })

        expect(res.status).toBe(400)
    })
})

describe('GET /api/testimonials (pagination and filters)', () => {
    async function createTestimonials(token, count) {
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

        const res = await request(app).get('/api/testimonials?page=1&limit=2').set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(res.body.data).toHaveLength(2)
        expect(res.body.pagination).toMatchObject({
            total: 5,
            page: 1,
            limit: 2,
            pages: 3,
        })
    })

    it('returns the second page with remaining items', async () => {
        const token = await registerAndLogin('page2owner@test.com')
        await createTestimonials(token, 5)

        const res = await request(app).get('/api/testimonials?page=3&limit=2').set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(res.body.data).toHaveLength(1)
    })

    it('filters testimonials by status', async () => {
        const token = await registerAndLogin('statusfilter@test.com')

        await request(app).post('/api/testimonials').set('Authorization', `Bearer ${token}`).send({ customerName: 'Still Draft' })

        const listRes = await request(app).get('/api/testimonials').set('Authorization', `Bearer ${token}`)

        const testimonialId = listRes.body.data[0].testimonialId

        await request(app)
            .patch(`/api/testimonials/${testimonialId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'recording' })

        const draftRes = await request(app).get('/api/testimonials?status=draft').set('Authorization', `Bearer ${token}`)

        const recordingRes = await request(app).get('/api/testimonials?status=recording').set('Authorization', `Bearer ${token}`)

        expect(draftRes.body.data).toHaveLength(0)
        expect(recordingRes.body.data).toHaveLength(1)
    })

    it('rejects an invalid sort field', async () => {
        const token = await registerAndLogin('badsort@test.com')

        const res = await request(app).get('/api/testimonials?sort=password').set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(400)
    })
})

describe('PUT /api/testimonials', () => {
    it('rejects an empty body for testimonial update with 400 and explicit message', async () => {
        const token = await registerAndLogin('emptyupdate@test.com')

        await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Update Me', rating: 3 })

        const listRes = await request(app).get('/api/testimonials').set('Authorization', `Bearer ${token}`)
        const testimonialId = listRes.body.data[0].testimonialId

        const res = await request(app).put(`/api/testimonials/${testimonialId}`).set('Authorization', `Bearer ${token}`).send({})

        expect(res.status).toBe(400)
        expect(res.body).toMatchObject({
            code: 400,
            status: 'failure',
        })

        const Testimonial = require('../../models/testimonial')
        const unchanged = await Testimonial.findOne({ testimonialId })
        expect(unchanged.customerName).toBe('Update Me')
    })
})

describe('Soft-deleted testimonial access', () => {
    it('returns 404 on GET for a soft-deleted testimonial', async () => {
        const token = await registerAndLogin('softget@test.com')
        const testimonialId = await createAndDelete(token)

        const res = await request(app).get(`/api/testimonials/${testimonialId}`).set('Authorization', `Bearer ${token}`)

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

describe('Additional edge cases', () => {
    it('validates and rejects invalid sendingOptions values', async () => {
        const token = await registerAndLogin('sendingvalid@test.com')

        const validRes = await request(app)
            .post('/api/testimonials/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({ sendingOptions: ['email', 'facebook'] })
        expect(validRes.status).toBe(200)

        const invalidRes = await request(app)
            .post('/api/testimonials/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({ sendingOptions: ['telegram'] })
        expect(invalidRes.status).toBe(400)
    })

    it('returns byStatus with zero counts for statuses with no testimonials', async () => {
        const token = await registerAndLogin('zerostatus@test.com')

        await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Only Draft', rating: 4 })

        const res = await request(app).get('/api/testimonials/analytics').set('Authorization', `Bearer ${token}`)

        const { byStatus } = res.body.data.overview

        expect(byStatus.draft).toBe(1)
        expect(byStatus.recording).toBe(0)
        expect(byStatus.processing).toBe(0)
        expect(byStatus.completed).toBe(0)
        expect(byStatus.shared).toBe(0)
    })

    it('returns all statuses at zero when there are no testimonials at all', async () => {
        const token = await registerAndLogin('nostatuses@test.com')

        const res = await request(app).get('/api/testimonials/analytics').set('Authorization', `Bearer ${token}`)

        const { byStatus, total, averageRating } = res.body.data.overview

        const { statuses } = require('../../lib/constants')
        statuses.forEach((status) => {
            expect(byStatus[status]).toBe(0)
        })

        expect(total).toBe(0)
        expect(averageRating).toBe(0)
    })

    it('rejects an excessively large pagination limit', async () => {
        const token = await registerAndLogin('maxlimit@test.com')

        const res = await request(app).get('/api/testimonials?limit=999999999').set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(400)
    })

    it('accepts the maximum allowed pagination limit', async () => {
        const token = await registerAndLogin('boundarylimit@test.com')

        const res = await request(app).get('/api/testimonials?limit=100').set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
    })

    it('does not leak internal error details on an unexpected 500', async () => {
        const token = await registerAndLogin('generic500@test.com')

        const logger = require('../../lib/logger')
        jest.spyOn(logger, 'error').mockImplementation(() => {})

        const Testimonial = require('../../models/testimonial')
        jest.spyOn(Testimonial, 'find').mockImplementation(() => {
            throw new Error('Internal DB connection string leaked: mongodb://secret')
        })

        const res = await request(app).get('/api/testimonials').set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(500)
        expect(res.body.message).toBe('Internal server error')

        jest.restoreAllMocks()
    })

    it('registers successfully with different email casing and treats them as the same user', async () => {
        await request(app).post('/api/auth/register').send({
            email: 'CaseTest@Example.com',
            password: 'password123',
            businessName: 'Case Biz',
        })

        const res = await request(app).post('/api/auth/register').send({
            email: 'casetest@example.com',
            password: 'password456',
            businessName: 'Case Biz Two',
        })

        expect(res.status).toBe(400)
    })

    it('returns 400 (not 500) on an empty body for testimonial update', async () => {
        const token = await registerAndLogin('emptyupdate@test.com')

        await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Update Me', rating: 3 })

        const listRes = await request(app).get('/api/testimonials').set('Authorization', `Bearer ${token}`)
        const testimonialId = listRes.body.data[0].testimonialId

        const res = await request(app).put(`/api/testimonials/${testimonialId}`).set('Authorization', `Bearer ${token}`).send({})

        expect(res.status).not.toBe(500)
    })

    it('handles soft-deleting an already soft-deleted testimonial gracefully', async () => {
        const token = await registerAndLogin('doubledelete@test.com')

        await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({ customerName: 'Delete Twice', rating: 3 })

        const listRes = await request(app).get('/api/testimonials').set('Authorization', `Bearer ${token}`)
        const testimonialId = listRes.body.data[0].testimonialId

        const firstDelete = await request(app).delete(`/api/testimonials/${testimonialId}`).set('Authorization', `Bearer ${token}`)
        expect(firstDelete.status).toBe(200)

        const secondDelete = await request(app).delete(`/api/testimonials/${testimonialId}`).set('Authorization', `Bearer ${token}`)

        expect(secondDelete.status).toBe(404)
    })
})
