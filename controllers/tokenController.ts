import jwt from "jsonwebtoken";
import assert from "assert/strict";

const { GRIDFIRE_SECRET } = process.env;

assert(GRIDFIRE_SECRET, "GRIDFIRE_SECRET env var missing.");

const generateToken = (payload: any, expiry = "10m") => jwt.sign(payload, GRIDFIRE_SECRET, { expiresIn: expiry });
const verifyToken = (token: string) => jwt.verify(token, GRIDFIRE_SECRET);

export { generateToken, verifyToken };
