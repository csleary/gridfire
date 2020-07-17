const jwt = require('jsonwebtoken');
const { nemp3Secret } = require('../config/keys');

const generateToken = payload => jwt.sign(payload, nemp3Secret, { expiresIn: '10m' });

module.exports = {
  generateToken
};
