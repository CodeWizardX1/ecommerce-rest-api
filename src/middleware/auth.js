import pkg from 'jsonwebtoken';
const { verify } = pkg;

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing_token' });

  try {
    const decoded = verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.sub, email: decoded.email, role: decoded.role || 'user' };
    next();
  } catch {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

export { requireAuth };
