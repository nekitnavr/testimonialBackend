const request = require('supertest')
const app = require('../app')
const { connect, closeDatabase, clearDatabase } = require('./dbSetup')
const { registerAndLogin } = require('./testHelpers')
const TestimonialSettings = require('../models/testimonialSettings')
const { verifyToken } = require('../lib/utils')

beforeAll(async () => {
    await connect()
})

afterEach(async () => {
    await clearDatabase()
})

afterAll(async () => {
    await closeDatabase()
})

describe('DB level validation for testimonialSettings', () => {
    it('rejects negative defaultVideoLength at the model level even bypassing HTTP validation', async () => {
        const TestimonialSettings = require('../models/testimonialSettings')

        const settings = new TestimonialSettings({ userId: 1, defaultVideoLength: -5 })
        await expect(settings.validate()).rejects.toThrow()
    })

    it('rejects a non-positive integer in videoLengthOptions at the model level', async () => {
        const TestimonialSettings = require('../models/testimonialSettings')

        const settings = new TestimonialSettings({ userId: 1, videoLengthOptions: [5, -1, 10] })
        await expect(settings.validate()).rejects.toThrow()
    })

    it('rejects an invalid channel in sendingOptions at the model level', async () => {
        const TestimonialSettings = require('../models/testimonialSettings')

        const settings = new TestimonialSettings({ userId: 1, sendingOptions: ['carrier_pigeon'] })
        await expect(settings.validate()).rejects.toThrow()
    })

    it('rejects an empty string in questionnaire at the model level', async () => {
        const TestimonialSettings = require('../models/testimonialSettings')

        const settings = new TestimonialSettings({ userId: 1, questionnaire: ['Valid question', '   '] })
        await expect(settings.validate()).rejects.toThrow()
    })
})

describe('POST /api/testimonials/settings', () => {
    it('creates settings on first upsert (201) and updates on second (200)', async () => {
        const token = await registerAndLogin('settingsowner@test.com')

        const createRes = await request(app)
            .post('/api/testimonials/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({ isEnabled: true, thankYouMessage: 'Thanks a lot!' })

        expect(createRes.status).toBe(200)

        const updateRes = await request(app)
            .post('/api/testimonials/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({ thankYouMessage: 'Updated message' })

        expect(updateRes.status).toBe(200)
    })

    it('tries to insert userId, but it gets ignored', async () => {
        const token = await registerAndLogin('settingsowner@test.com')

        const { userId } = verifyToken(token)

        const createRes = await request(app)
            .post('/api/testimonials/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({ isEnabled: true, thankYouMessage: 'Thanks a lot!', userId: 99999 })

        expect(createRes.status).toBe(200)
        const settings = await TestimonialSettings.findOne({ userId })
        expect(settings).toBeDefined()
        expect(settings.userId).not.toBe(99999)
    })

    it('merges a partial contactConsent update without wiping sibling fields (via atomic upsert)', async () => {
        const token = await registerAndLogin('atomicmerge@test.com')

        await request(app)
            .post('/api/testimonials/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({ contactConsent: { enabled: false, text: 'Custom' } })

        await request(app)
            .post('/api/testimonials/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({ contactConsent: { text: 'Updated' } })

        const res = await request(app).get('/api/testimonials/settings').set('Authorization', `Bearer ${token}`)

        expect(res.body.data.contactConsent.enabled).toBe(false)
        expect(res.body.data.contactConsent.text).toBe('Updated')
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

        const res = await request(app).get('/api/testimonials/settings').set('Authorization', `Bearer ${token}`)

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

        const res = await request(app).get('/api/testimonials/settings').set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(res.body.data).toBeNull()
    })
})
