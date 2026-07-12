const { mergeFields } = require('../lib/utils')
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

    mergeFields(settings, updates)
    await settings.save()

    return { settings, isNew }
}

async function getSettings(userId) {
    return TestimonialSettings.findOne({ userId })
}

module.exports = { upsertSettings, getSettings }
