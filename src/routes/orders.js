import { Router } from 'express';
import { query, pool } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT id, user_id, status, subtotal_cents, shipping_cents, tax_cents, total_cents,
            billing_address_id, shipping_address_id, placed_at
     FROM orders WHERE user_id=$1 ORDER BY id DESC`,
    [req.user.id]
  );
  res.json(rows);
});

router.get('/:id', requireAuth, async (req, res) => {
  const id = +req.params.id;
  const { rows: orders } = await query(
    `SELECT * FROM orders WHERE id=$1 AND user_id=$2`,
    [id, req.user.id]
  );
  if (!orders.length) return res.status(404).json({ error: 'not_found' });

  const { rows: items } = await query(
    `SELECT id, product_id, title_snapshot, unit_price_cents, quantity
     FROM order_items WHERE order_id=$1 ORDER BY id`,
    [id]
  );

  res.json({ ...orders[0], items });
});

router.post('/', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // load cart + items with product and inventory
    const { rows: cartRows } = await client.query(`SELECT id FROM carts WHERE user_id=$1`, [req.user.id]);
    if (!cartRows.length) return res.status(400).json({ error: 'empty_cart' });
    const cartId = cartRows[0].id;

    const { rows: items } = await client.query(
      `SELECT ci.product_id, p.title, ci.quantity, ci.unit_price_cents, inv.quantity AS stock
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       JOIN inventory inv ON inv.product_id = p.id
       WHERE ci.cart_id=$1`,
      [cartId]
    );
    if (!items.length) return res.status(400).json({ error: 'empty_cart' });

    // stock check
    for (const it of items) {
      if (it.stock < it.quantity) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'insufficient_stock', product_id: it.product_id });
      }
    }

    const subtotal = items.reduce((s, i) => s + i.unit_price_cents * i.quantity, 0);
    const shipping = 0; // flat for MVP
    const tax = 0;
    const total = subtotal + shipping + tax;

    const { billing_address_id, shipping_address_id } = req.body || {};

    // create order
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders
       (user_id, status, subtotal_cents, shipping_cents, tax_cents, total_cents,
        billing_address_id, shipping_address_id)
       VALUES ($1,'pending',$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [req.user.id, subtotal, shipping, tax, total, billing_address_id || null, shipping_address_id || null]
    );
    const order = orderRows[0];

    // add order items
    for (const it of items) {
      await client.query(
        `INSERT INTO order_items
         (order_id, product_id, title_snapshot, unit_price_cents, quantity)
         VALUES ($1,$2,$3,$4,$5)`,
        [order.id, it.product_id, it.title, it.unit_price_cents, it.quantity]
      );
      // decrement inventory
      await client.query(
        `UPDATE inventory SET quantity = quantity - $1 WHERE product_id=$2`,
        [it.quantity, it.product_id]
      );
    }

    // clear cart
    await client.query(`DELETE FROM cart_items WHERE cart_id=$1`, [cartId]);

    await client.query('COMMIT');

    const { rows: orderItems } = await query(
      `SELECT id, product_id, title_snapshot, unit_price_cents, quantity
       FROM order_items WHERE order_id=$1 ORDER BY id`, [order.id]
    );

    res.status(201).json({ ...order, items: orderItems });
  } catch (e) {
    await pool.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ error: 'order_failed' });
  } finally {
    client.release();
  }
});

export default router;
