const roles = ['owner', 'staff']
const saltRounds = 10;
const statuses = ["draft", "recording", "processing", "completed", "shared"]
const allowedChannels = ["email", "sms", "facebook", "instagram"]
const allowedTestimonialSettings = [
    'isEnabled',
    'defaultVideoLength',
    'videoLengthOptions',
    'questionnaire',
    'sendingOptions',
    'thankYouMessage',
    'contactConsent',
]
const allowedTestimonialFields = [
    'customerName',
    'customerEmail',
    'customerPhone',
    'videoUrl',
    'rating',
    'text',
    'consentGiven'
]

module.exports = {
    roles, 
    saltRounds, 
    statuses, 
    allowedChannels,
    allowedTestimonialSettings,
    allowedTestimonialFields
}