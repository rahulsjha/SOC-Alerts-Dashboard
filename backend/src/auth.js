import jwt from 'jsonwebtoken';
import db from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'soc-alerts-secret-key-change-in-prod';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000
};

export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

export const authMiddleware = (req, res, next) => {
  const token = req.cookies?.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.userId = decoded.userId;
  next();
};

export const setAuthCookie = (res, token) => {
  res.cookie('token', token, COOKIE_OPTIONS);
};

export const clearAuthCookie = (res) => {
  res.clearCookie('token', {
    ...COOKIE_OPTIONS,
    maxAge: undefined
  });
};

export const getAuthenticatedUser = (userId) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, email, name, created_at FROM users WHERE id = ?',
      [userId],
      (err, user) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(user || null);
      }
    );
  });
};

export default { generateToken, verifyToken, authMiddleware };
