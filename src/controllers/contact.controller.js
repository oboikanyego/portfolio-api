const ContactMessage = require('../models/contact-message.model');
const { sendContactEmail } = require('../services/mail.service');
const { getPagination, paginatedResult } = require('../utils/pagination');

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

    // Keep the saved enquiry successful even if notification delivery fails.
    sendContactEmail({
      fullName,
      email,
      company,
      subject,
      budget,
      message
    }).catch((error) => {
      console.error('Contact notification failed:', error.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Message received successfully'
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
