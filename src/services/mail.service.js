const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

const compileTemplate = (fileName) => Handlebars.compile(
  fs.readFileSync(path.join(__dirname, '..', 'templates', fileName), 'utf8')
);
const renderContactEmail = compileTemplate('contact-email.hbs');
const renderCvRequestEmail = compileTemplate('cv-request-email.hbs');

console.log('📧 Initializing mail transporter...');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('CONTACT_RECEIVER:', process.env.CONTACT_RECEIVER);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendContactEmail({
  fullName,
  email,
  company,
  subject,
  budget,
  message
}) {
  try {
    console.log('📨 sendContactEmail called');
    console.log('Sending email for:', email);

    const mailOptions = {
      from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.CONTACT_RECEIVER,
      subject: `Portfolio Contact: ${subject}`,
      html: renderContactEmail({
        fullName,
        email,
        company: company || 'N/A',
        budget: budget || 'N/A',
        subject,
        message
      })
    };

    console.log('📤 About to send email...');
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully');
    console.log('Response:', info.response);

    return info;
  } catch (error) {
    console.error('❌ Email sending failed');
    console.error(error);
    throw error;
  }
}

async function sendCvRequestEmail({ fullName, email, company, reason }) {
  return transporter.sendMail({
    from: `"Portfolio CV Request" <${process.env.EMAIL_USER}>`,
    to: process.env.CONTACT_RECEIVER,
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
