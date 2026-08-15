const ContactMessage = require('../models/contact-message.model');
const { sendContactEmail } = require('../services/mail.service');
const { getPagination, paginatedResult } = require('../utils/pagination');

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

exports.getContacts = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const [contacts, total] = await Promise.all([
      ContactMessage.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ContactMessage.countDocuments()
    ]);
    return res.json(paginatedResult(contacts, total, page, limit));
  } catch (error) {
    console.error('getContacts error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load contact enquiries.' });
  }
};
