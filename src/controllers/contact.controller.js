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

    const clean = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
    const cleanName = clean(fullName, 120);
    const cleanEmail = clean(email, 180).toLowerCase();
    const cleanSubject = clean(subject, 200);
    const cleanMessage = clean(message, 5000);
    if (!cleanName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || !cleanSubject || !cleanMessage) {
      return res.status(400).json({ success: false, message: 'A name, valid email, subject and message are required.' });
    }
    const contact = new ContactMessage({
      fullName: cleanName,
      email: cleanEmail,
      company: clean(company, 160),
      subject: cleanSubject,
      budget: clean(budget, 100),
      message: cleanMessage
    });

    await contact.save();

    // Keep the saved enquiry successful even if notification delivery fails.
    sendContactEmail({
      fullName: cleanName,
      email: cleanEmail,
      company: clean(company, 160),
      subject: cleanSubject,
      budget: clean(budget, 100),
      message: cleanMessage
    }).then((result) => ContactMessage.updateOne(
      { _id: contact._id },
      { $push: { notificationHistory: { status: 'accepted', providerId: result?.id || '' } } }
    )).catch((error) => {
      console.error('Contact notification failed:', error.message);
      return ContactMessage.updateOne(
        { _id: contact._id },
        { $push: { notificationHistory: { status: 'failed', error: String(error.message).slice(0, 180) } } }
      ).catch(logError => console.error('Notification history update failed:', logError.message));
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
