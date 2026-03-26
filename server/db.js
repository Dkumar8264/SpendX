const mongoose = require('mongoose');

let cachedConnection = global.mongooseConnection;
let cachedPromise = global.mongooseConnectionPromise;

const connectToDatabase = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not configured.');
  }

  if (!cachedPromise) {
    cachedPromise = mongoose.connect(process.env.MONGO_URI).then((mongooseInstance) => mongooseInstance);
    global.mongooseConnectionPromise = cachedPromise;
  }

  cachedConnection = await cachedPromise;
  global.mongooseConnection = cachedConnection;

  return cachedConnection;
};

module.exports = connectToDatabase;
