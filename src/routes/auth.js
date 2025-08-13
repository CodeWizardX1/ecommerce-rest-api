import { Router } from 'express';
import { hash as _hash, compare } from 'bcryptjs';
import pkg from 'jsonwebtoken';
const { sign } = pkg;
import { query } from '../db/index.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { email, password, fullName } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email_password_required' });

  const hash = await _hash(password, 10);
  try {
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1,$2,$3)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, full_name, created_at`,
      [email, hash, fullName || null]
    );
    if (!rows.length) return res.status(409).json({ error: 'email_in_use' });

    // auto-create empty cart
    await query(`INSERT INTO carts (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [rows[0].id]);

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'register_failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email_password_required' });

  try {
    const { rows } = await query(`SELECT id, email, password_hash FROM users WHERE email=$1`, [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'bad_credentials' });

    const ok = await compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'bad_credentials' });

    const token = sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'login_failed' });
  }
});

export default router;
