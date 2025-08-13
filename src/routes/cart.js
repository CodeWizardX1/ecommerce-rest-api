import { Router } from 'express';
import { query } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

async function ensureCart(userId) {
  const { rows } = await query(
    `INSERT INTO carts (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET updated_at=NOW()
     RETURNING id`,
    [userId]
  );
  return rows[0].id;
}

async function getCart(userId) {
  const { rows: cartRows } = await query(`SELECT id, user_id, created_at FROM carts WHERE user_id=$1`, [userId]);
  if (!cartRows.length) return null;
  const cart = cartRows[0];
  const { rows: items } = await query(
    `SELECT ci.id, ci.product_id, p.title, ci.unit_price_cents, ci.quantity
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id=$1
     ORDER BY ci.id`,
    [cart.id]
  );
  const subtotal = items.reduce((s, i) => s + i.unit_price_cents * i.quantity, 0);
  return { id: cart.id, user_id: userId, items, subtotal_cents: subtotal, created_at: cart.created_at };
}

router.get('/', requireAuth, async (req, res) => {
  await ensureCart(req.user.id);
  const cart = await getCart(req.user.id);
  res.json(cart);
});

router.post('/items', requireAuth, async (req, res) => {
  const { productId, quantity } = req.body || {};
  if (!productId || !quantity || quantity < 1) return res.status(400).json({ error: 'productId_and_quantity_required' });

  const cartId = await ensureCart(req.user.id);

  // snapshot price and check inventory
  const { rows: prodRows } = await query(`SELECT id, price_cents FROM products WHERE id=$1 AND is_active=TRUE`, [productId]);
  if (!prodRows.length) return res.status(404).json({ error: 'product_not_found' });

  const { rows: invRows } = await query(`SELECT quantity FROM inventory WHERE product_id=$1`, [productId]);
  if (!invRows.length || invRows[0].quantity < quantity) return res.status(409).json({ error: 'insufficient_stock' });

  await query(
    `INSERT INTO cart_items (cart_id, product_id, quantity, unit_price_cents)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (cart_id, product_id)
     DO UPDATE SET quantity=EXCLUDED.quantity, unit_price_cents=EXCLUDED.unit_price_cents`,
    [cartId, productId, quantity, prodRows[0].price_cents]
  );

  const cart = await getCart(req.user.id);
  res.json(cart);
});

router.put('/items/:itemId', requireAuth, async (req, res) => {
  const itemId = +req.params.itemId;
  const { quantity } = req.body || {};
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'quantity_required' });

  // check stock against product
  const { rows: item } = await query(
    `SELECT ci.product_id FROM cart_items ci
     JOIN carts c ON c.id = ci.cart_id
     WHERE ci.id=$1 AND c.user_id=$2`,
    [itemId, req.user.id]
  );
  if (!item.length) return res.status(404).json({ error: 'item_not_found' });

  const { rows: inv } = await query(`SELECT quantity FROM inventory WHERE product_id=$1`, [item[0].product_id]);
  if (!inv.length || inv[0].quantity < quantity) return res.status(409).json({ error: 'insufficient_stock' });

  await query(
    `UPDATE cart_items SET quantity=$1
     WHERE id=$2 AND cart_id=(SELECT id FROM carts WHERE user_id=$3)`,
    [quantity, itemId, req.user.id]
  );

  const cart = await getCart(req.user.id);
  res.json(cart);
});

router.delete('/items/:itemId', requireAuth, async (req, res) => {
  await query(
    `DELETE FROM cart_items
     WHERE id=$1 AND cart_id=(SELECT id FROM carts WHERE user_id=$2)`,
    [+req.params.itemId, req.user.id]
  );
  res.status(204).end();
});

router.delete('/', requireAuth, async (req, res) => {
  await query(
    `DELETE FROM cart_items WHERE cart_id=(SELECT id FROM carts WHERE user_id=$1)`,
    [req.user.id]
  );
  res.status(204).end();
});

export default router;
