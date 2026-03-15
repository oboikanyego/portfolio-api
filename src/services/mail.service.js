const nodemailer = require('nodemailer');

console.log('📧 Initializing mail transporter...');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('CONTACT_RECEIVER:', process.env.CONTACT_RECEIVER);

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
  try {
    console.log('📨 sendContactEmail called');
    console.log('Sending email for:', email);

    const mailOptions = {
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

module.exports = { sendContactEmail };
