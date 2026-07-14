const { flatten } = require('mongo-dot-notation')
const TestimonialSettings = require('../models/testimonialSettings')

/**
 *
 * @param {number} userId
 * @param {Object} updates
 * @returns {Object} {settings, isNew}
 */
async function upsertSettings(userId, updates) {
    const setFields = flatten(updates)

    const settings = await TestimonialSettings.findOneAndUpdate(
        { userId },
        { ...setFields, $setOnInsert: { userId } },
        {
            upsert: true,
            returnDocument: 'after',
            runValidators: true,
            setDefaultsOnInsert: true,
        },
    )

    return settings
}

async function getSettings(userId) {
    return TestimonialSettings.findOne({ userId })
}

module.exports = { upsertSettings, getSettings }
