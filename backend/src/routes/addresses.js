// backend/src/routes/addresses.js
const express = require('express');
const { db } = require('../db');
const { validateAddress } = require('../utils/validation');
const auth = require('../middleware/auth');
const router = express.Router();

// Add new address for a customer
router.post('/customers/:id/addresses', auth, (req, res) => {
  const customer_id = req.params.id;
  const errors = validateAddress(req.body);
  if (errors.length) return res.status(400).json({ errors });
  const { address_details, city, state, pin_code } = req.body;
  db.run(
    'INSERT INTO addresses(customer_id,address_details,city,state,pin_code) VALUES(?,?,?,?,?)',
    [customer_id, address_details, city, state, pin_code],
    function(err){
      if (err) return res.status(400).json({ error: err.message });
      res.status(201).json({ id: this.lastID, message: 'Address added' });
    }
  );
});

// List addresses for a customer
router.get('/customers/:id/addresses', auth, (req, res) => {
  db.all('SELECT * FROM addresses WHERE customer_id = ? ORDER BY created_at DESC', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

// Update an address
router.put('/addresses/:addressId', auth, (req, res) => {
  const id = req.params.addressId;
  const { address_details, city, state, pin_code } = req.body;
  const partial = { address_details, city, state, pin_code };

  const fields = [];
  const params = [];
  Object.entries(partial).forEach(([k, v]) => { if (v !== undefined) { fields.push(`${k} = ?`); params.push(v); }});
  if (!fields.length) return res.json({ message: 'Nothing to update' });
  params.push(id);

  db.run(`UPDATE addresses SET ${fields.join(', ')} WHERE id = ?`, params, function(err){
    if (err) return res.status(500).json({ error: 'Update failed' });
    res.json({ changes: this.changes, message: 'Address updated' });
  });
});

// Delete an address
router.delete('/addresses/:addressId', auth, (req, res) => {
  db.run('DELETE FROM addresses WHERE id = ?', [req.params.addressId], function(err){
    if (err) return res.status(500).json({ error: 'Delete failed' });
    res.json({ deleted: this.changes > 0 });
  });
});

// Report: customers with multiple addresses
router.get('/reports/multiple-addresses', auth, (req, res) => {
  const { city, state, pin } = req.query;
  const cond = ['1=1'];
  const params = [];
  if (city) { cond.push('a.city = ?'); params.push(city); }
  if (state) { cond.push('a.state = ?'); params.push(state); }
  if (pin) { cond.push('a.pin_code = ?'); params.push(pin); }

  const sql = `
    SELECT c.id as customer_id, c.first_name, c.last_name,
           COUNT(a.id) AS address_count
    FROM customers c
    JOIN addresses a ON a.customer_id = c.id
    WHERE ${cond.join(' AND ')}
    GROUP BY c.id
    HAVING COUNT(a.id) > 1
    ORDER BY address_count DESC, c.created_at DESC`;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Query failed' });

    const ids = rows.map(r => r.customer_id);
    if (ids.length === 0) return res.json([]);
    const placeholders = ids.map(() => '?').join(',');
    db.all(`SELECT * FROM addresses WHERE customer_id IN (${placeholders}) ORDER BY customer_id`, ids, (e2, addrs) => {
      if (e2) return res.status(500).json({ error: 'Address load failed' });
      const map = {};
      rows.forEach(r => map[r.customer_id] = { ...r, addresses: [] });
      addrs.forEach(a => map[a.customer_id]?.addresses.push(a));
      res.json(Object.values(map));
    });
  });
});

module.exports = router;
