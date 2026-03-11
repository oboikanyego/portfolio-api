const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
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
  await transporter.sendMail({
    from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
    to: process.env.CONTACT_RECEIVER,
    subject: `Portfolio Contact: ${subject}`,
    html: `
      <h2>New Portfolio Contact Message</h2>
      <p><strong>Full Name:</strong> ${fullName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Company:</strong> ${company || 'N/A'}</p>
      <p><strong>Budget:</strong> ${budget || 'N/A'}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <h3>Message</h3>
      <p>${message}</p>
    `
  });
}

module.exports = { sendContactEmail };
