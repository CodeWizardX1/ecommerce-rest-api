import { Router } from 'express';
import { query } from '../db/index.js';
import { paged } from '../utils/http.js';

const router = Router();

// List
router.get('/', async (req, res) => {
  const { search = '', categoryId, limit = 20, offset = 0 } = req.query;
  const params = [];
  const where = ['is_active = TRUE'];

  if (search) { params.push(`%${search}%`); where.push(`(title ILIKE $${params.length})`); }
  if (categoryId) { params.push(+categoryId); where.push(`(category_id = $${params.length})`); }

  params.push(+limit, +offset);

  const sql =
    `SELECT id, title, description, price_cents, category_id, is_active
     FROM products
     WHERE ${where.join(' AND ')}
     ORDER BY id DESC
     LIMIT $${params.length-1} OFFSET $${params.length}`;

  const [{ rows }, count] = await Promise.all([
    query(sql, params),
    query(`SELECT COUNT(*)::int AS total FROM products WHERE ${where.join(' AND ')}`, params.slice(0, -2))
  ]);

  res.json(paged(rows, { limit:+limit, offset:+offset, total: count.rows[0].total }));
});

// Get by id
router.get('/:id', async (req, res) => {
  const { rows } = await query(
    `SELECT id, title, description, price_cents, category_id, is_active
     FROM products WHERE id=$1`,
    [+req.params.id]
  );
  const p = rows[0];
  if (!p) return res.status(404).json({ error: 'not_found' });
  res.json(p);
});

// Admin-ish create/update (you can add actual role checks later)
router.post('/', async (req, res) => {
  const p = req.body || {};
  if (!p.title || p.price_cents == null) return res.status(400).json({ error: 'title_and_price_required' });

  const { rows } = await query(
    `INSERT INTO products (title, description, price_cents, category_id, sku, is_active)
     VALUES ($1,$2,$3,$4,$5,TRUE)
     RETURNING *`,
    [p.title, p.description || null, p.price_cents, p.category_id || null, p.sku || null]
  );
  // ensure inventory row exists
  await query(`INSERT INTO inventory (product_id, quantity) VALUES ($1, 0) ON CONFLICT (product_id) DO NOTHING`, [rows[0].id]);
  res.status(201).json(rows[0]);
});

router.put('/:id', async (req, res) => {
  const p = req.body || {};
  const { rows } = await query(
    `UPDATE products SET
       title=COALESCE($1,title),
       description=$2,
       price_cents=COALESCE($3, price_cents),
       category_id=$4,
       sku=COALESCE($5, sku),
       is_active=COALESCE($6, is_active),
       updated_at=NOW()
     WHERE id=$7
     RETURNING *`,
    [p.title, p.description ?? null, p.price_cents, p.category_id ?? null, p.sku, p.is_active, +req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'not_found' });
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  await query(`UPDATE products SET is_active=FALSE WHERE id=$1`, [+req.params.id]);
  res.status(204).end();
});

export default router;
