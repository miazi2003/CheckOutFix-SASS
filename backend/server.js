require('dotenv').config();
const app = require('./app');
const connectDB = require('./src/config/db');
const { initCronJobs } = require('./src/jobs/scan.job');

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    initCronJobs();
  });
}).catch(err => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
