const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const database = require('./database');
const authenticateToken = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT;

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const isProduction = process.env.NODE_ENV === 'production';

app.post("/api/register", async (req, res) => {
    try {
        const { username, password, inviteCode } = req.body;

        const inviteResult = await database.query("SELECT * FROM invite_codes WHERE code = $1", [inviteCode]);

        if (inviteResult.rows.length === 0) {
            return res.status(400).json({
                error: "Invalid invite code"
            });
        }

        const userResult = await database.query("SELECT id FROM users WHERE username = $1", [username]);

        if (userResult.rows.length > 0) {
            return res.status(400).json({
                error: "Username already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await database.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hashedPassword]);

        res.json({
            success: "Successful registration"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Server error"
        });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const result = await database.query("SELECT id, username, password FROM users WHERE username = $1", [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: "Invalid username or password"
            });
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({
                error: "Invalid username or password"
            });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 60 * 60 * 1000
        });

        res.json({ success: true, username: user.username });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Server error"
        });
    }
});

app.get("/api/conversations", authenticateToken, async (req, res) => {
    const userId = req.user.userId
    const result = await database.query(
        `
        SELECT 
            c.id AS conversation_id,
            u.username
        FROM conversation_members my_cm
        JOIN conversations c 
            ON c.id = my_cm.conversation_id
        JOIN conversation_members other_cm 
            ON other_cm.conversation_id = c.id 
        AND other_cm.user_id != my_cm.user_id
        JOIN users u 
            ON u.id = other_cm.user_id
        WHERE my_cm.user_id = $1
        `,
        [userId]
    );

    res.json({
        success: true,
        conversations: result.rows
    });
});

app.post("/api/logout", (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax'
    });
    res.json({ success: true });
});

app.get("/api/me", authenticateToken, async (req, res) => {
    res.json({ userId: req.user.userId, username: req.user.username });
});

app.listen(PORT, () => {
    console.log(`Backend running: http://localhost:${PORT}`);
});