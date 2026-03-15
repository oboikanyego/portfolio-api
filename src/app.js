const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const contactRoutes = require('./routes/contact.routes');

const app = express();

// app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Developer portfolio API is healthy' });
});

app.use('/api/contact', contactRoutes);

module.exports = app;
