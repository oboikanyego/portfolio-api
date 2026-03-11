const ContactMessage = require('../models/contact-message.model');

async function createMessage(payload) {
  return ContactMessage.create(payload);
}

module.exports = { createMessage };
