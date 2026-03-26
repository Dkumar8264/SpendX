const app = require('../server/app');
const connectToDatabase = require('../server/db');

module.exports = async (req, res) => {
  try {
    await connectToDatabase();
    return app(req, res);
  } catch (error) {
    console.error('API bootstrap failed:', error.message);
    return res.status(500).json({
      message: 'Authentication service is unavailable. Check backend env and database connection.',
    });
  }
};
