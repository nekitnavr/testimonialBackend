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

describe('POST /api/testimonials/settings', () => {
    it('creates settings on first upsert (201) and updates on second (200)', async () => {
        const token = await registerAndLogin('settingsowner@test.com')

        const createRes = await request(app)
            .post('/api/testimonials/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({ isEnabled: true, thankYouMessage: 'Thanks a lot!' })

        expect(createRes.status).toBe(201)

        const updateRes = await request(app)
            .post('/api/testimonials/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({ thankYouMessage: 'Updated message' })

        expect(updateRes.status).toBe(200)
    })

    it('merges contactConsent instead of overwriting it', async () => {
        const token = await registerAndLogin('consentowner@test.com')

        await request(app)
            .post('/api/testimonials/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({ contactConsent: { enabled: false } })

        await request(app)
            .post('/api/testimonials/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({ contactConsent: { text: 'New consent text' } })

        const res = await request(app)
            .get('/api/testimonials/settings')
            .set('Authorization', `Bearer ${token}`)

        expect(res.body.data.contactConsent.enabled).toBe(false)
        expect(res.body.data.contactConsent.text).toBe('New consent text')
    })

    it('rejects empty videoLengthOptions array', async () => {
        const token = await registerAndLogin('emptyoptions@test.com')

        const res = await request(app)
            .post('/api/testimonials/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({ videoLengthOptions: [] })

        expect(res.status).toBe(400)
    })

    it('rejects non-integer values in videoLengthOptions', async () => {
        const token = await registerAndLogin('badoptions@test.com')

        const res = await request(app)
            .post('/api/testimonials/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({ videoLengthOptions: [5, 'ten', 15] })

        expect(res.status).toBe(400)
    })

    it('rejects negative defaultVideoLength', async () => {
        const token = await registerAndLogin('negativelen@test.com')

        const res = await request(app)
            .post('/api/testimonials/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({ defaultVideoLength: -5 })

        expect(res.status).toBe(400)
    })

    it('rejects invalid sendingOptions channel', async () => {
        const token = await registerAndLogin('badchannel@test.com')

        const res = await request(app)
            .post('/api/testimonials/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({ sendingOptions: ['carrier_pigeon'] })

        expect(res.status).toBe(400)
    })

    it('deduplicates sendingOptions', async () => {
        const token = await registerAndLogin('dupechannel@test.com')

        await request(app)
            .post('/api/testimonials/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({ sendingOptions: ['email', 'email', 'sms'] })

        const res = await request(app)
            .get('/api/testimonials/settings')
            .set('Authorization', `Bearer ${token}`)

        expect(res.body.data.sendingOptions.sort()).toEqual(['email', 'sms'])
    })

    it('rejects contactConsent.enabled that is not boolean', async () => {
        const token = await registerAndLogin('badconsent@test.com')

        const res = await request(app)
            .post('/api/testimonials/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({ contactConsent: { enabled: 'yes' } })

        expect(res.status).toBe(400)
    })
})

describe('GET /api/testimonials/settings', () => {
    it('returns null when no settings exist yet', async () => {
        const token = await registerAndLogin('nosettings@test.com')

        const res = await request(app)
            .get('/api/testimonials/settings')
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(res.body.data).toBeNull()
    })
})