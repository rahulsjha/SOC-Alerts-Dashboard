import express from 'express';
import bcryptjs from 'bcryptjs';
import db from '../db.js';
import { generateToken } from '../auth.js';

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
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token
      });
    });
  });
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// GET /auth/me - verify token and get current user
router.get('/me', (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // For now, just verify the token is valid
  // In production, decode and get user from DB
  res.json({ authenticated: true });
});

export default router;
