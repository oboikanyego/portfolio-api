const mongoose = require('mongoose');
const ContactMessage = require('../models/contact-message.model');
const CvRequest = require('../models/cv-request.model');

const TYPES = new Set(['all', 'contact', 'cv']);
const STATUSES = new Set(['all', 'unread', 'read', 'replied']);
const escapeRegex = value => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function parseInboxQuery(query = {}) {
  const type = TYPES.has(query.type) ? query.type : 'all';
  const status = STATUSES.has(query.status) ? query.status : 'all';
  const search = typeof query.search === 'string' ? query.search.trim().slice(0, 80) : '';
  const page = Math.min(1000, Math.max(1, Number.parseInt(query.page, 10) || 1));
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 15));
  return { type, status, search, page, limit };
}
const contactProjection = {
  _id: 1, type: { $literal: 'contact' }, fullName: 1, email: 1,
  company: 1, subject: 1, budget: 1, message: 1,
  createdAt: 1, readAt: 1, repliedAt: 1, notificationHistory: 1,
  workflowStatus: { $ifNull: ['$workflowStatus', 'unread'] }
};
const cvProjection = {
  _id: 1, type: { $literal: 'cv' }, fullName: 1, email: 1,
  company: 1, reason: 1, subject: { $literal: 'CV request' },
  createdAt: 1, readAt: 1, repliedAt: 1, notificationHistory: 1,
  workflowStatus: { $ifNull: ['$workflowStatus', 'unread'] }
};

function buildInboxPipeline({ type, status, search, page, limit }) {
  const stages = [
    { $project: contactProjection },
    { $unionWith: { coll: CvRequest.collection.name, pipeline: [{ $project: cvProjection }] } }
  ];
  const match = {};
  if (type !== 'all') match.type = type;
  if (status !== 'all') match.workflowStatus = status;
  if (search) {
    const q = escapeRegex(search);
    match.$or = ['fullName', 'email', 'company', 'subject', 'message', 'reason']
      .map(key => ({ [key]: { $regex: q, $options: 'i' } }));
  }
  if (Object.keys(match).length) stages.push({ $match: match });
  stages.push({ $facet: {
    data: [{ $sort: { createdAt: -1, _id: -1 } }, { $skip: (page-1)*limit }, { $limit: limit }],
    total: [{ $count: 'count' }]
  } });
  return stages;
}
async function getUnreadCount() {
  const [contacts, cvs] = await Promise.all([
    ContactMessage.countDocuments({ workflowStatus: { $in: [null, 'unread'] } }),
    CvRequest.countDocuments({ workflowStatus: { $in: [null, 'unread'] } })
  ]);
  return { contacts, cv: cvs, total: contacts + cvs };
}
exports.listInbox = async (req, res) => {
  try {
    const filters = parseInboxQuery(req.query);
    const [result, unread] = await Promise.all([
      ContactMessage.aggregate(buildInboxPipeline(filters)),
      getUnreadCount()
    ]);
    const data = result[0]?.data ?? [];
    const total = result[0]?.total?.[0]?.count ?? 0;
    res.set('Cache-Control', 'no-store');
    return res.json({ success: true, data, total, page: filters.page,
      pages: Math.ceil(total / filters.limit) || 1, limit: filters.limit, unread });
  } catch (error) {
    console.error('Admin inbox load failed:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to load admin inbox.' });
  }
};

exports.updateInboxStatus = async (req, res) => {
  try {
    const Model = req.params.type === 'contact'
      ? ContactMessage : req.params.type === 'cv' ? CvRequest : null;
    if (!Model || !mongoose.isValidObjectId(req.params.id) || !['read','unread','replied'].includes(req.body?.status)) {
      return res.status(400).json({ success: false, message: 'Invalid request type, ID or status.' });
    }
    const status = req.body.status;
    const now = new Date();
    const update = {
      workflowStatus: status,
      readAt: status === 'unread' ? null : now,
      repliedAt: status === 'replied' ? now : null
    };
    const document = await Model.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true }).lean();
    if (!document) return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    res.set('Cache-Control', 'no-store');
    return res.json({ success: true, id: document._id, workflowStatus: document.workflowStatus,
      readAt: document.readAt, repliedAt: document.repliedAt });
  } catch (error) {
    console.error('Admin inbox status update failed:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to change enquiry status.' });
  }
};
exports.parseInboxQuery = parseInboxQuery;
exports.buildInboxPipeline = buildInboxPipeline;
