import express from 'express';
import bcryptjs from 'bcryptjs';
import db from '../db.js';
import { generateToken, setAuthCookie, clearAuthCookie, getAuthenticatedUser, verifyToken } from '../auth.js';

const router = express.Router();

// POST /auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    bcryptjs.compare(password, user.password_hash, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken(user.id);
      setAuthCookie(res, token);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at
        }
      });
    });
  });
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Logged out successfully' });
});

// GET /auth/me - verify token and get current user
router.get('/me', (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  getAuthenticatedUser(decoded.userId)
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      res.json({ user });
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
});

export default router;
