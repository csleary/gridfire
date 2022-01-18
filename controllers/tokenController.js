import jwt from "jsonwebtoken";

const { GRIDFIRE_SECRET } = process.env;
const generateToken = (payload, expiry = "10m") => jwt.sign(payload, GRIDFIRE_SECRET, { expiresIn: expiry });
const verifyToken = token => jwt.verify(token, GRIDFIRE_SECRET);

export { generateToken, verifyToken };
