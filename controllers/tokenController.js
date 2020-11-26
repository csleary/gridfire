const jwt = require('jsonwebtoken');
const { nemp3Secret } = require('../config/keys');

const generateToken = (payload, expiry = '10m') => jwt.sign(payload, nemp3Secret, { expiresIn: expiry });

const verifyToken = token => jwt.verify(token, nemp3Secret);

module.exports = {
  generateToken,
  verifyToken
};
