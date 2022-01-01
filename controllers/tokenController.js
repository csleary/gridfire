import jwt from 'jsonwebtoken';

const { NEMP3_SECRET } = process.env;
const generateToken = (payload, expiry = '10m') => jwt.sign(payload, nemp3Secret, { expiresIn: expiry });
const verifyToken = token => jwt.verify(token, nemp3Secret);

export { generateToken, verifyToken };
