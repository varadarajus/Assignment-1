// backend/src/routes/customers.js
const express = require('express');
const { db } = require('../db');
const { validateCustomer } = require('../utils/validation');
const auth = require('../middleware/auth');
const router = express.Router();

// Helper to build list query with filters, pagination and sorting
function buildListQuery(qp) {
  const {
    q, city, state, pin, hasOneAddress, sortBy = 'created_at', sortDir = 'DESC', page = 1, limit = 10
  } = qp;

  const where = [];
  const params = [];

  if (q) {
    where.push('(first_name LIKE ? OR last_name LIKE ? OR phone_number LIKE ? OR EXISTS (SELECT 1 FROM addresses a WHERE a.customer_id = customers.id AND (a.city LIKE ? OR a.state LIKE ? OR a.pin_code LIKE ? OR a.address_details LIKE ?)))');
    const like = `%${q}%`;
    params.push(like, like, like, like, like, like, like);
  }
  if (city) { where.push('EXISTS (SELECT 1 FROM addresses a WHERE a.customer_id = customers.id AND a.city = ?)'); params.push(city); }
  if (state) { where.push('EXISTS (SELECT 1 FROM addresses a WHERE a.customer_id = customers.id AND a.state = ?)'); params.push(state); }
  if (pin) { where.push('EXISTS (SELECT 1 FROM addresses a WHERE a.customer_id = customers.id AND a.pin_code = ?)'); params.push(pin); }
  if (hasOneAddress === 'true') { where.push('(SELECT COUNT(*) FROM addresses a WHERE a.customer_id = customers.id) = 1'); }
  if (hasOneAddress === 'false') { where.push('(SELECT COUNT(*) FROM addresses a WHERE a.customer_id = customers.id) <> 1'); }

  const validSort = ['first_name','last_name','created_at'];
  const sort = validSort.includes(sortBy) ? sortBy : 'created_at';
  const dir = String(sortDir).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * pageSize;

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const base = `FROM customers ${whereSql}`;
  const dataSql = `SELECT customers.*, (SELECT COUNT(*) FROM addresses a WHERE a.customer_id = customers.id) AS address_count ${base} ORDER BY ${sort} ${dir} LIMIT ? OFFSET ?`;
  const countSql = `SELECT COUNT(*) as total ${base}`;

  return { dataSql, countSql, params, pageSize, offset };
}

// Create customer
router.post('/', auth, (req, res) => {
  const errors = validateCustomer(req.body);
  if (errors.length) return res.status(400).json({ errors });
  const { first_name, last_name, phone_number } = req.body;
  db.run('INSERT INTO customers(first_name,last_name,phone_number) VALUES(?,?,?)', [first_name, last_name, phone_number], function(err){
    if (err) return res.status(400).json({ error: err.message });
    res.status(201).json({ id: this.lastID, message: 'Customer created' });
  });
});

// List customers
router.get('/', auth, (req, res) => {
  const { dataSql, countSql, params, pageSize, offset } = buildListQuery(req.query);
  db.get(countSql, params, (err, countRow) => {
    if (err) return res.status(500).json({ error: 'Count failed' });
    db.all(dataSql, [...params, pageSize, offset], (err2, rows) => {
      if (err2) return res.status(500).json({ error: 'Query failed' });
      const mapped = rows.map(r => ({
        ...r,
        only_one_address: r.address_count === 1
      }));
      res.json({ total: countRow.total, data: mapped });
    });
  });
});

// Get one customer with addresses
router.get('/:id', auth, (req, res) => {
  const id = req.params.id;
  db.get('SELECT customers.*, (SELECT COUNT(*) FROM addresses a WHERE a.customer_id = customers.id) AS address_count FROM customers WHERE id=?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(404).json({ error: 'Customer not found' });
    db.all('SELECT * FROM addresses WHERE customer_id = ? ORDER BY created_at DESC', [id], (e2, addrs) => {
      if (e2) return res.status(500).json({ error: 'DB error' });
      res.json({ ...row, only_one_address: row.address_count === 1, addresses: addrs });
    });
  });
});

// Update
router.put('/:id', auth, (req, res) => {
  const id = req.params.id;
  const { first_name, last_name, phone_number } = req.body;
  const partial = { first_name, last_name, phone_number };
  const errors = [];
  if (first_name !== undefined) {
    if (String(first_name).trim().length < 2) errors.push('first_name too short');
  }
  if (last_name !== undefined) {
    if (String(last_name).trim().length < 2) errors.push('last_name too short');
  }
  if (phone_number !== undefined) {
    if (!/^[0-9]{10}$/.test(String(phone_number))) errors.push('phone_number invalid');
  }
  if (errors.length) return res.status(400).json({ errors });

  const fields = [];
  const params = [];
  Object.entries(partial).forEach(([k, v]) => {
    if (v !== undefined) { fields.push(`${k} = ?`); params.push(v); }
  });
  if (!fields.length) return res.json({ message: 'Nothing to update' });
  params.push(id);

  db.run(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, params, function(err){
    if (err) return res.status(500).json({ error: 'Update failed' });
    res.json({ changes: this.changes, message: 'Customer updated' });
  });
});

// Delete
router.delete('/:id', auth, (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM customers WHERE id = ?', [id], function(err){
    if (err) return res.status(500).json({ error: 'Delete failed' });
    res.json({ deleted: this.changes > 0 });
  });
});

module.exports = router;
