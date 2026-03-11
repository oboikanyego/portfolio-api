const ContactMessage = require('../models/contact-message.model');
const { sendContactEmail } = require('../services/mail.service');

exports.createContact = async (req, res) => {
  try {
    const {
      fullName,
      email,
      company,
      subject,
      budget,
      message
    } = req.body;

    const contact = new ContactMessage({
      fullName,
      email,
      company,
      subject,
      budget,
      message
    });

    await contact.save();

    await sendContactEmail({
      fullName,
      email,
      company,
      subject,
      budget,
      message
    });

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('createContact error:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send message'
    });
  }
};
