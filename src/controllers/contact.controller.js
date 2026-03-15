const ContactMessage = require('../models/contact-message.model');
const { sendContactEmail } = require('../services/mail.service');

exports.createContact = async (req, res) => {
  try {
    console.log('1. createContact hit');
    console.log('2. req.body:', req.body);

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

    console.log('3. before contact.save()');
    await contact.save();
    console.log('4. after contact.save()');

    console.log('5. before sendContactEmail()');
    await sendContactEmail({
      fullName,
      email,
      company,
      subject,
      budget,
      message
    });
    console.log('6. after sendContactEmail()');

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
