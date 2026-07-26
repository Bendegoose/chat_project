const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcrypt');
const database = require('./database');

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.get('/api/users', async (req, res) => {
  try {
    const result = await database.query('SELECT id, username, created_at FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error' });
  }
});

app.post("/api/register", async (req, res) => {
    try {
        const { username, password, inviteCode } = req.body;

        const inviteResult = await database.query("SELECT * FROM invite_codes WHERE code = $1",[inviteCode]);

        if (inviteResult.rows.length === 0) {
            return res.status(400).json({
                error: "Invalid invite code"
            });
        }

        const userResult = await database.query("SELECT id FROM users WHERE username = $1",[username]);

        if (userResult.rows.length > 0) {
            return res.status(400).json({
                error: "Username already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await database.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hashedPassword]);

        res.json({
            success: true
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Server error"
        });
    }
});

app.listen(PORT, () => {
  console.log(`Backend running: http://localhost:${PORT}`);
});