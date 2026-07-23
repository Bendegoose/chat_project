const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./database');

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, created_at FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running: http://localhost:${PORT}`);
});