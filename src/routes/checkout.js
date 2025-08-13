// src/routes/checkout.js
import express from 'express';
import { query, pool } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/v1/checkout
 * Body: {
 *   billing_address_id?: number,
 *   shipping_address_id?: number,
 *   provider?: 'test' | 'stripe' | string
 * }
 */
router.post('/', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Load cart
    const { rows: cartRows } = await client.query(
      `SELECT id FROM carts WHERE user_id=$1`,
      [req.user.id]
    );
    if (!cartRows.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'empty_cart' });
    }
    const cartId = cartRows[0].id;

    // Cart items + stock
    const { rows: items } = await client.query(
      `SELECT ci.product_id, p.title, ci.quantity, ci.unit_price_cents, inv.quantity AS stock
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       JOIN inventory inv ON inv.product_id = p.id
       WHERE ci.cart_id=$1`,
      [cartId]
    );
    if (!items.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'empty_cart' });
    }
    for (const it of items) {
      if (it.stock < it.quantity) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'insufficient_stock', product_id: it.product_id });
      }
    }

    // Totals
    const subtotal = items.reduce((s, i) => s + i.unit_price_cents * i.quantity, 0);
    const shipping = 0; // keep simple for MVP
    const tax = 0;
    const total = subtotal + shipping + tax;

    const { billing_address_id, shipping_address_id, provider = 'test' } = req.body || {};

    // Create order as paid
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders
        (user_id, status, subtotal_cents, shipping_cents, tax_cents, total_cents,
         billing_address_id, shipping_address_id)
       VALUES ($1,'paid',$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [req.user.id, subtotal, shipping, tax, total, billing_address_id || null, shipping_address_id || null]
    );
    const order = orderRows[0];

    // Order items
    for (const it of items) {
      await client.query(
        `INSERT INTO order_items
           (order_id, product_id, title_snapshot, unit_price_cents, quantity)
         VALUES ($1,$2,$3,$4,$5)`,
        [order.id, it.product_id, it.title, it.unit_price_cents, it.quantity]
      );
      await client.query(
        `UPDATE inventory SET quantity = quantity - $1 WHERE product_id=$2`,
        [it.quantity, it.product_id]
      );
    }

    // Simulated payment success
    const providerRef = `TEST-${Date.now()}`;
    await client.query(
      `INSERT INTO payments (order_id, provider, provider_ref, amount_cents, status)
       VALUES ($1,$2,$3,$4,'succeeded')`,
      [order.id, provider, providerRef, total]
    );

    // Clear cart
    await client.query(`DELETE FROM cart_items WHERE cart_id=$1`, [cartId]);

    await client.query('COMMIT');

    // Load items for response
    const { rows: orderItems } = await query(
      `SELECT id, product_id, title_snapshot, unit_price_cents, quantity
       FROM order_items WHERE order_id=$1 ORDER BY id`, [order.id]
    );
    const { rows: payments } = await query(
      `SELECT id, provider, provider_ref, amount_cents, status, created_at
       FROM payments WHERE order_id=$1 ORDER BY id`, [order.id]
    );

    res.status(201).json({ ...order, items: orderItems, payments });
  } catch (e) {
    try { await pool.query('ROLLBACK'); } catch {}
    console.error(e);
    res.status(500).json({ error: 'checkout_failed' });
  } finally {
    client.release();
  }
});

export default router;
