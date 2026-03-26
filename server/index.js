const app = require('./app');
const { loadEnv } = require('./config');
const connectToDatabase = require('./db');

loadEnv();

const PORT = process.env.PORT || 5000;

connectToDatabase()
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  });
