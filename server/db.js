const mongoose = require('mongoose');
const { getRequiredEnv, loadEnv } = require('./config');

let cachedConnection = global.mongooseConnection;
let cachedPromise = global.mongooseConnectionPromise;

const connectToDatabase = async () => {
  loadEnv();

  if (cachedConnection) {
    return cachedConnection;
  }

  const mongoUri = getRequiredEnv('MONGO_URI');

  if (!cachedPromise) {
    cachedPromise = mongoose.connect(mongoUri).then((mongooseInstance) => mongooseInstance);
    global.mongooseConnectionPromise = cachedPromise;
  }

  cachedConnection = await cachedPromise;
  global.mongooseConnection = cachedConnection;

  return cachedConnection;
};

module.exports = connectToDatabase;
