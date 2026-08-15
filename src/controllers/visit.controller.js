const Visit = require('../models/visit.model');
const { getPagination, paginatedResult } = require('../utils/pagination');

exports.recordVisit = async (req, res) => {
  try {
    const visitorId = cleanString(req.body.visitorId, 100);
    const sessionId = cleanString(req.body.sessionId, 100);
    const path = cleanString(req.body.path, 300) || '/';
    const referrer = cleanString(req.body.referrer, 500);

    if (!visitorId || !sessionId) {
      return res.status(400).json({ success: false, message: 'Visitor and session IDs are required.' });
    }

    await Visit.updateOne(
      { sessionId },
      { $setOnInsert: { visitorId, sessionId, path, referrer } },
      { upsert: true }
    );

    return res.status(202).json({ success: true });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(202).json({ success: true });
    }
    console.error('recordVisit error:', error);
    return res.status(500).json({ success: false, message: 'Unable to record visit.' });
  }
};

function cleanString(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

exports.getVisitStats = async (req, res) => {
  try {
    const requestedDays = Number.parseInt(req.query.days, 10);
    const days = Math.min(Math.max(Number.isFinite(requestedDays) ? requestedDays : 14, 7), 90);
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - (days - 1));

    const [daily, totalVisits, uniqueVisitors] = await Promise.all([
      Visit.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
            visits: { $sum: 1 },
            visitors: { $addToSet: '$visitorId' }
          }
        },
        { $project: { _id: 0, date: '$_id', visits: 1, uniqueVisitors: { $size: '$visitors' } } },
        { $sort: { date: 1 } }
      ]),
      Visit.countDocuments(),
      Visit.distinct('visitorId').then((ids) => ids.length)
    ]);

    const byDate = new Map(daily.map((item) => [item.date, item]));
    const series = Array.from({ length: days }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index);
      const key = date.toISOString().slice(0, 10);
      return byDate.get(key) || { date: key, visits: 0, uniqueVisitors: 0 };
    });

    return res.json({
      success: true,
      rangeDays: days,
      totalVisits,
      uniqueVisitors,
      today: series.at(-1)?.visits || 0,
      series
    });
  } catch (error) {
    console.error('getVisitStats error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load visit analytics.' });
  }
};

exports.getVisits = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const [visits, total] = await Promise.all([
      Visit.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Visit.countDocuments()
    ]);
    return res.json(paginatedResult(visits, total, page, limit));
  } catch (error) {
    console.error('getVisits error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load visits.' });
  }
};
