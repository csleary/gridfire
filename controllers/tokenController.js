import jwt from 'jsonwebtoken';
import { nemp3Secret } from '../config/keys.js';

const generateToken = (payload, expiry = '10m') => jwt.sign(payload, nemp3Secret, { expiresIn: expiry });
const verifyToken = token => jwt.verify(token, nemp3Secret);

export { generateToken, verifyToken };
