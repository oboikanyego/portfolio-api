require('dotenv').config();
const { sendContactEmail } = require('../src/services/mail.service');
const { connectDb } = require('../src/config/db');
const { ensureEmailTemplates } = require('../src/services/email-template.service');
const mongoose = require('mongoose');

connectDb().then(ensureEmailTemplates).then(() => sendContactEmail({
  fullName: 'Portfolio delivery test',
  email: process.env.CONTACT_RECEIVER,
  company: 'Local verification',
  subject: 'Resend is connected',
  budget: 'N/A',
  message: 'This confirms that the portfolio API can deliver email through the Resend HTTPS API.'
})).then((result) => {
  console.log(`Test email sent successfully: ${result.id}`);
}).catch((error) => {
  console.error(`Test email failed: ${error.message}`);
  process.exit(1);
});

process.on('beforeExit', () => { if (mongoose.connection.readyState) mongoose.disconnect().catch(console.error); });
