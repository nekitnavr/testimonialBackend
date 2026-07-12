const TestimonialSettings = require('../models/testimonialSettings')

/**
 *
 * @param {number} userId
 * @param {Object} updates
 * @returns {Object} {settings, isNew}
 */
async function upsertSettings(userId, updates) {
    let settings = await TestimonialSettings.findOne({ userId })
    const isNew = !settings
    if (isNew) settings = new TestimonialSettings({ userId })

    Object.entries(updates).forEach(([field, value]) => {
        const isPlainObject = value !== null && typeof value === 'object' && !Array.isArray(value)
        if (isPlainObject && settings[field] && typeof settings[field] === 'object') {
            Object.assign(settings[field], value)
        } else {
            settings[field] = value
        }
    })
    await settings.save()

    return { settings, isNew }
}

async function getSettings(userId) {
    return TestimonialSettings.findOne({ userId })
}

module.exports = { upsertSettings, getSettings }
