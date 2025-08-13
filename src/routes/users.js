import { Router } from 'express';
import { query } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT id, email, full_name, phone, created_at FROM users WHERE id=$1`,
    [req.user.id]
  );
  res.json(rows[0]);
});

router.put("/me", requireAuth, async (req, res) => {
  const { full_name, phone } = req.body || {};
  const { rows } = await query(
    `UPDATE users SET full_name=COALESCE($1, full_name),
                       phone=COALESCE($2, phone),
                       updated_at=NOW()
     WHERE id=$3
     RETURNING id, email, full_name, phone, created_at`,
    [full_name ?? null, phone ?? null, req.user.id]
  );
  res.json(rows[0]);
});

/* Addresses */
router.get("/me/addresses", requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM addresses WHERE user_id=$1 ORDER BY id`,
    [req.user.id]
  );
  res.json(rows);
});

router.post("/me/addresses", requireAuth, async (req, res) => {
  const a = req.body || {};
  const { rows } = await query(
    `INSERT INTO addresses (user_id,label,line1,line2,city,region,postal_code,country_code,
                            is_default_billing,is_default_shipping)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      req.user.id,
      a.label,
      a.line1,
      a.line2,
      a.city,
      a.region,
      a.postal_code,
      a.country_code,
      !!a.is_default_billing,
      !!a.is_default_shipping,
    ]
  );
  res.status(201).json(rows[0]);
});

router.put("/me/addresses/:id", requireAuth, async (req, res) => {
  const id = +req.params.id;
  const a = req.body || {};
  const { rows } = await query(
    `UPDATE addresses
     SET label=COALESCE($1,label),
         line1=COALESCE($2,line1),
         line2=$3,
         city=COALESCE($4,city),
         region=$5,
         postal_code=COALESCE($6,postal_code),
         country_code=COALESCE($7,country_code),
         is_default_billing=COALESCE($8,is_default_billing),
         is_default_shipping=COALESCE($9,is_default_shipping)
     WHERE id=$10 AND user_id=$11
     RETURNING *`,
    [
      a.label,
      a.line1,
      a.line2 ?? null,
      a.city,
      a.region ?? null,
      a.postal_code,
      a.country_code,
      a.is_default_billing,
      a.is_default_shipping,
      id,
      req.user.id,
    ]
  );
  if (!rows.length) return res.status(404).json({ error: "address_not_found" });
  res.json(rows[0]);
});

router.delete("/me/addresses/:id", requireAuth, async (req, res) => {
  const id = +req.params.id;
  await query(`DELETE FROM addresses WHERE id=$1 AND user_id=$2`, [
    id,
    req.user.id,
  ]);
  res.status(204).end();
});

export default router;
