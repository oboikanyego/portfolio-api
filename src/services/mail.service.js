const { Resend } = require('resend');

const { renderStoredTemplate } = require('./email-template.service');

let resendClient;

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const to = process.env.CONTACT_RECEIVER?.trim();

  const missing = [
    !apiKey && 'RESEND_API_KEY',
    !from && 'EMAIL_FROM',
    !to && 'CONTACT_RECEIVER'
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(`Email delivery is not configured. Missing: ${missing.join(', ')}`);
  }

  return { apiKey, from, to };
}

async function sendEmail({ subject, html, replyTo }) {
  const config = getEmailConfig();
  resendClient ||= new Resend(config.apiKey);

  const { data, error } = await resendClient.emails.send({
    from: config.from,
    to: config.to,
    replyTo,
    subject: subject.replace(/[\r\n]+/g, ' ').trim(),
    html
  });

  if (error) {
    throw new Error(`Resend email failed: ${error.message || 'Unknown delivery error'}`);
  }

  console.log(`Resend email accepted: ${data.id}`);
  return data;
}

async function sendContactEmail({ fullName, email, company, subject, budget, message, source }) {
  const rendered = await renderStoredTemplate('contact', {
    fullName, email, company: company || 'N/A', subject, budget: budget || 'N/A', message, source
  });
  return sendEmail({ replyTo: email, ...rendered });
}
async function sendCvRequestEmail({ fullName, email, company, reason, source }) {
  const rendered = await renderStoredTemplate('cv-request', {
    fullName, email, company: company || 'N/A', reason: reason || 'No reason supplied', source
  });
  return sendEmail({ replyTo: email, ...rendered });
}

module.exports = { sendContactEmail, sendCvRequestEmail };
