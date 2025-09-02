// backend/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { init } = require('./db');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const addressRoutes = require('./routes/addresses');

init();

const app = express();
app.use(cors());
app.use(express.json());
app.use(logger);

app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api', addressRoutes);

app.use(errorHandler);
// Show all users (for debugging only, don’t keep in production)
app.get("/debug/users", (req, res) => {
  db.all("SELECT id, username FROM users", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running http://localhost:${PORT}`));
