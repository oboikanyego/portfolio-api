require('dotenv').config();
const { sendContactEmail } = require('../src/services/mail.service');

sendContactEmail({
  fullName: 'Portfolio delivery test',
  email: process.env.CONTACT_RECEIVER,
  company: 'Local verification',
  subject: 'Resend is connected',
  budget: 'N/A',
  message: 'This confirms that the portfolio API can deliver email through the Resend HTTPS API.'
}).then((result) => {
  console.log(`Test email sent successfully: ${result.id}`);
}).catch((error) => {
  console.error(`Test email failed: ${error.message}`);
  process.exit(1);
});
