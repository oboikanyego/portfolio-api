const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { Resend } = require('resend');

const compileTemplate = (fileName) => Handlebars.compile(
  fs.readFileSync(path.join(__dirname, '..', 'templates', fileName), 'utf8')
);
const renderContactEmail = compileTemplate('contact-email.hbs');
const renderCvRequestEmail = compileTemplate('cv-request-email.hbs');

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

function sendContactEmail({ fullName, email, company, subject, budget, message }) {
  return sendEmail({
    replyTo: email,
    subject: `Portfolio Contact: ${subject}`,
    html: renderContactEmail({
      fullName,
      email,
      company: company || 'N/A',
      budget: budget || 'N/A',
      subject,
      message
    })
  });
}

function sendCvRequestEmail({ fullName, email, company, reason }) {
  return sendEmail({
    replyTo: email,
    subject: `CV request from ${fullName}`,
    html: renderCvRequestEmail({
      fullName,
      email,
      company: company || 'N/A',
      reason: reason || 'No reason supplied'
    })
  });
}

module.exports = { sendContactEmail, sendCvRequestEmail };
