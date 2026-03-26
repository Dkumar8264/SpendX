const app = require('../server/app');
const connectToDatabase = require('../server/db');

module.exports = async (req, res) => {
  await connectToDatabase();
  return app(req, res);
};
