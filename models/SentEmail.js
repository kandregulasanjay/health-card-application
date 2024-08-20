const mongoose = require('mongoose');

const sentEmailSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    couponNumber: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
});

const SentEmail = mongoose.model('SentEmail', sentEmailSchema, 'sent_emails');
module.exports = SentEmail;