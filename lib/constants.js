const roles = ['owner', 'staff']
const saltRounds = 10;
const statuses = ["draft", "recording", "processing", "completed", "shared"]
const allowedChannels = ["email", "sms", "facebook", "instagram"]

module.exports = {roles, saltRounds, statuses, allowedChannels}