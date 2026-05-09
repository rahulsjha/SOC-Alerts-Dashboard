import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'soc-alerts-secret-key-change-in-prod';

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

export default { generateToken, verifyToken, authMiddleware };
