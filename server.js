require('dotenv').config();
const app = require('./src/app');
const { connectDb } = require('./src/config/db');

const PORT = process.env.PORT || 3000;

connectDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Portfolio API running on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
