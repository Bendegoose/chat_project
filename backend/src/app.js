const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');
const database = require('./database');
const authenticateToken = require('./middleware/auth');
const cookie = require('cookie');
const { log } = require('console');

const app = express();
const PORT = process.env.PORT;

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true
    }
});

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
        res.status(500).json({
            error: "Server error"
        });
    }
});

app.get("/api/conversations", authenticateToken, async (req, res) => {
    const userId = req.user.userId
    const result = await database.query(
        `
        SELECT DISTINCT ON (c.id)
            c.id AS conversation_id,
            u.username,
            m.encrypted_message,
            m.created_at AS last_message_time
        FROM conversation_members my_cm
        JOIN conversations c
        ON c.id = my_cm.conversation_id
        JOIN conversation_members other_cm
        ON other_cm.conversation_id = c.id
        AND other_cm.user_id != my_cm.user_id
        JOIN users u
        ON u.id = other_cm.user_id
        LEFT JOIN messages m
        ON m.conversation_id = c.id
        WHERE my_cm.user_id = $1
        ORDER BY c.id, m.created_at DESC
        `,
        [userId]
    );

    res.json({
        success: true,
        conversations: result.rows
    });
});

app.post("/api/conversations", authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const { userId: targetUserId } = req.body;


        if (!targetUserId) {
            return res.status(400).json({
                error: "Missing userId"
            });
        }

        if (Number(currentUserId) === Number(targetUserId)) {
            return res.status(400).json({
                error: "Cannot create conversation with yourself"
            });
        }

        const targetUser = await database.query(
            `
            SELECT id, username
            FROM users
            WHERE id = $1
            `,
            [targetUserId]
        );

        if (targetUser.rows.length === 0) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        const username = targetUser.rows[0].username;

        const hasConversation = await database.query(
            `
            SELECT c.id
            FROM conversations c
            JOIN conversation_members cm1
                ON cm1.conversation_id = c.id
            JOIN conversation_members cm2
                ON cm2.conversation_id = c.id
            WHERE c.is_group = false
            AND cm1.user_id = $1
            AND cm2.user_id = $2
            AND (
                SELECT COUNT(*)
                FROM conversation_members cm3
                WHERE cm3.conversation_id = c.id
            ) = 2
            `,
            [
                currentUserId,
                targetUserId
            ]
        );

        if (hasConversation.rows.length > 0) {

            return res.json({
                conversationId: hasConversation.rows[0].id,
                username
            });

        }

        const conversation = await database.query(
            `
            INSERT INTO conversations (is_group)
            VALUES (false)
            RETURNING id
            `
        );


        const conversationId = conversation.rows[0].id;

        await database.query(
            `
            INSERT INTO conversation_members
            (
                conversation_id,
                user_id
            )
            VALUES
            ($1, $2),
            ($1, $3)
            `,
            [
                conversationId,
                currentUserId,
                targetUserId
            ]
        );

        const newConversationData = {
            conversation_id: conversationId,
            username: req.user.username
        };

        io.to(`user_${targetUserId}`).emit(
            "newConversation",
            newConversationData
        );

        res.json({
            conversationId,
            username
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Server error"
        });
    }
});

app.get("/api/message/:id", authenticateToken, async (req, res) => {
    const conversationId = req.params.id;
    const userId = req.user.userId;

    const isMember = await database.query(
        `
        SELECT 1
        FROM conversation_members
        WHERE conversation_id = $1
        AND user_id = $2
        `,
        [conversationId, userId]
    );

    if (isMember.rows.length === 0) {
        return res.status(403).json({
            error: "Not a member of this conversation"
        });
    }

    const result = await database.query(
        `
        SELECT
            m.id,
            m.sender_id,
            m.encrypted_message,
            m.created_at,
            u.username
        FROM messages m
        JOIN users u
        ON u.id = m.sender_id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at ASC
        `,
        [conversationId]
    );

    res.json({
        success: true,
        messages: result.rows
    });
});

app.post("/api/sendMessage", authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { conversationId, message } = req.body;

    if (!message?.trim()) {
        return res.status(400).json({
            error: "Message cannot be empty"
        });
    }

    const isMember = await database.query(
        `
        SELECT 1 
        FROM conversation_members
        WHERE conversation_id = $1
        AND user_id = $2
        `,
        [conversationId, userId]
    )

    if (isMember.rowCount === 0) {
        return res.status(403).json({
            error: "Not a member of this conversation"
        });
    }

    const insertResult = await database.query(
        `
        INSERT INTO messages (
            conversation_id,
            sender_id,
            encrypted_message
        )
        VALUES ($1, $2, $3)
        RETURNING id, created_at
        `,
        [conversationId, userId, message]
    );

    const newMessage = {
        id: insertResult.rows[0].id,
        conversation_id: conversationId,
        sender_id: userId,
        username: req.user.username,
        encrypted_message: message,
        created_at: insertResult.rows[0].created_at
    };

    const members = await database.query(
        `
        SELECT user_id
        FROM conversation_members
        WHERE conversation_id = $1
        `,
        [conversationId]
    );

    members.rows.forEach((member) => {
        io.to(`user_${member.user_id}`).emit("newMessage", newMessage);
    });
    members.rows.forEach((member) => {
        io.to(`user_${member.user_id}`).emit("newMessage", newMessage);
    });


    res.json({
        success: true,
        message: newMessage
    });
});

app.get("/api/search", authenticateToken, async (req, res) => {
    const q = req.query.q;

    if (!q || q.length < 2)
        return res.json([]);

    const result = await database.query(`
        SELECT id, username
        FROM users
        WHERE username ILIKE $1
        LIMIT 20
    `, [`${q}%`]);

    res.json(result.rows);
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

const cookieParserMiddleware = cookieParser();

io.use((socket, next) => {
    cookieParserMiddleware(socket.request, {}, (err) => {
        if (err) {
            return next(new Error("Authentication error: cookie parse failed"));
        }

        try {
            const token = socket.request.cookies.token;

            if (!token) {
                return next(new Error("Authentication error: no token"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            socket.userId = decoded.userId;
            socket.username = decoded.username;

            next();
        } catch (err) {
            console.error("Socket auth error:", err.name, err.message);
            next(new Error("Authentication error: invalid token"));
        }
    });
});

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.username} (${socket.userId})`);

    socket.join(`user_${socket.userId}`);

    socket.on("joinConversation", (conversationId) => {
        socket.join(`conversation_${conversationId}`);
    });

    socket.on("leaveConversation", (conversationId) => {
        socket.leave(`conversation_${conversationId}`);
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.username}`);
    });
});

server.listen(PORT, () => {
    console.log(`Backend running: http://localhost:${PORT}`);
});