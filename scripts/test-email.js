require('dotenv').config();
const mongoose = require('mongoose');
const { connectDb } = require('../src/config/db');
const { ensureEmailTemplates } = require('../src/services/email-template.service');
const { sendContactEmail } = require('../src/services/mail.service');

(async () => {
  try {
    await connectDb();
    await ensureEmailTemplates();
    const result = await sendContactEmail({
      fullName: 'Portfolio delivery test',
      email: process.env.CONTACT_RECEIVER,
      company: 'Local verification',
      subject: 'Resend is connected',
      budget: 'N/A',
      message: 'This confirms that the portfolio API can deliver email through the Resend HTTPS API.'
    });
    console.log('Test email accepted by Resend: ' + result.id);
  } catch (error) {
    console.error('Test email failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
