const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const contactRoutes = require('./routes/contact.routes');
const authRoutes = require('./routes/auth.routes');
const cvRequestRoutes = require('./routes/cv-request.routes');
const visitRoutes = require('./routes/visit.routes');
const siteConfigRoutes = require('./routes/site-config.routes');

const app = express();
const defaultAllowedOrigins = [
  'http://localhost:4200',
  'http://127.0.0.1:4200',
  'https://oboikanyego-portfolio.netlify.app'
];
const configuredOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);
const allowedOrigins = new Set([...defaultAllowedOrigins, ...configuredOrigins]);

app.use(cors({
  origin(origin, callback) {
    const normalizedOrigin = origin?.replace(/\/$/, '');
    if (!origin || allowedOrigins.has('*') || allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Developer portfolio API is healthy' });
});

app.use('/api/contact', contactRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cv-requests', cvRequestRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/site-config', siteConfigRoutes);

module.exports = app;
