const CvRequest = require('../models/cv-request.model');
const { cleanLeadSource } = require('../utils/lead-source');
const { sendCvRequestEmail } = require('../services/mail.service');
const { getPagination, paginatedResult } = require('../utils/pagination');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.createCvRequest = async (req, res) => {
  try {
    const fullName = cleanString(req.body.fullName, 120);
    const email = cleanString(req.body.email, 180).toLowerCase();
    const company = cleanString(req.body.company, 160);
    const reason = cleanString(req.body.reason, 1000);
    const source = cleanLeadSource(req.body.source, 'request_cv');

    if (!fullName || !emailPattern.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'A valid name and email address are required.'
      });
    }

    const request = await CvRequest.create({ fullName, email, company, reason, source });

    sendCvRequestEmail({ fullName, email, company, reason, source }).then((result) =>
      CvRequest.updateOne({ _id: request._id }, {
        $push: { notificationHistory: { status: 'accepted', providerId: result?.id || '' } }
      })
    ).catch((error) => {
      console.error('CV request notification failed:', error.message);
      return CvRequest.updateOne({ _id: request._id }, {
        $push: { notificationHistory: { status: 'failed', error: String(error.message).slice(0, 180) } }
      }).catch(logError => console.error('Notification history update failed:', logError.message));
    });

    return res.status(201).json({
      success: true,
      requestId: request.id,
      message: 'CV request received. I will send it to you shortly.'
    });
  } catch (error) {
    console.error('createCvRequest error:', error);
    return res.status(500).json({ success: false, message: 'Unable to submit the CV request.' });
  }
};

function cleanString(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

exports.getCvRequests = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const [requests, total] = await Promise.all([
      CvRequest.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      CvRequest.countDocuments()
    ]);
    return res.json(paginatedResult(requests, total, page, limit));
  } catch (error) {
    console.error('getCvRequests error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load CV requests.' });
  }
};
