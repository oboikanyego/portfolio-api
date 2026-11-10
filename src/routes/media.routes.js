const router = require('express').Router();
const { requireAdmin } = require('../middleware/admin-auth.middleware');
const { rateLimit } = require('express-rate-limit');
const express = require('express');
const { uploadImage } = require('../controllers/media.controller');
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 18,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many image uploads. Please try later.' }
});
router.post('/images', requireAdmin, uploadLimiter, express.json({ limit: '9mb' }), uploadImage);
module.exports = router;
