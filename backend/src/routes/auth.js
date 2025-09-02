// backend/src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

// Seed admin - dev helper
router.post('/seed-admin', (req, res) => {
  db.get('SELECT id FROM users LIMIT 1', [], (err, row) => {
    if (row) return res.json({ message: 'Admin exists' });
    const hashed = bcrypt.hashSync('admin123', 10);
    db.run('INSERT INTO users(email, password) VALUES(?, ?)', ['admin@example.com', hashed], function(e){
      if (e) return res.status(500).json({ error: 'Seed failed' });
      res.json({ message: 'Admin seeded', email: 'admin@example.com', password: 'admin123' });
    });
  });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    console.log("User from DB:", user);
    console.log("Password entered:", password);
    const ok = bcrypt.compareSync(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '2h' });
    res.json({ token });
  });
});

const auth = require('../middleware/auth');
router.get('/me', auth, (req, res) => {
  db.get('SELECT id, email, created_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });
});

module.exports = router;
