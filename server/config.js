const path = require('path');
const dotenv = require('dotenv');

let envLoaded = false;

const loadEnv = () => {
  if (envLoaded) {
    return;
  }

  dotenv.config({ path: path.join(__dirname, '.env') });
  envLoaded = true;
};

const getRequiredEnv = (name) => {
  loadEnv();

  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
};

module.exports = {
  loadEnv,
  getRequiredEnv,
};
