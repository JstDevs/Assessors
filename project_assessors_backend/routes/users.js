import express from 'express';
const router = express.Router();
import bcrypt from 'bcrypt';
import pool from "../db.js";

// ---------------------------------------------------------
// user/register
// Creates a new user. Use this to create your Super Admin.
// ---------------------------------------------------------
router.post('/register', async (req, res) => {
    try {
        const { username, password, role_id } = req.body;

        // 1. Validate Input
        if (!username || !password || !role_id) {
            return res.status(400).json({ error: "Username, password, and role_id are required." });
        }

        // 2. Prevent Duplicate Usernames
        const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(409).json({ error: "Username already taken." });
        }

        // 3. Hash the Password Securely
        // 10 salt rounds is the current standard balancing security and performance
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 4. Insert into Database
        const insertQuery = `
            INSERT INTO users (username, password_hash, role_id) 
            VALUES (?, ?, ?)
        `;
        const [result] = await pool.query(insertQuery, [username, passwordHash, role_id]);

        res.status(201).json({
            message: "User created successfully",
            data: {
                userId: result.insertId,
                username: username,
                role_id: role_id
            }
        });

    } catch (err) {
        console.error("User registration error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ---------------------------------------------------------
// user/login
// Verifies credentials and returns user data with permissions
// ---------------------------------------------------------
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required." });
        }

        const query = `
            SELECT u.id, u.username, u.password_hash, u.role_id, u.is_active, r.permission_level, r.name as role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.username = ?
        `;
        const [users] = await pool.query(query, [username]);

        if (users.length === 0) {
            return res.status(401).json({ error: "Invalid username or password." });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(403).json({ error: "Account is disabled. Contact an administrator." });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid username or password." });
        }

        res.json({
            message: "Login successful",
            user: {
                id: user.id,
                username: user.username,
                role_id: user.role_id,
                role_name: user.role_name,
                permission_level: user.permission_level
            }
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// ---------------------------------------------------------
// user/roles
// Fetches all available roles for the creation dropdown
// ---------------------------------------------------------
router.get('/roles', async (req, res) => {
    try {
        // Fetch roles ordered by permission level so they display logically
        const [roles] = await pool.query(`
            SELECT id, name, description, permission_level 
            FROM roles 
            ORDER BY permission_level ASC
        `);
        
        res.json(roles);
    } catch (err) {
        console.error("Error fetching roles:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ---------------------------------------------------------
// GET user/users
// Fetches all active users with their associated role names
// ---------------------------------------------------------
router.get('/users', async (req, res) => {
    try {
        // Efficient JOIN to get the user data along with their human-readable role name
        // We exclude password_hash for security
        const query = `
            SELECT 
                u.id, 
                u.username, 
                u.role_id, 
                r.name AS role_name, 
                r.permission_level,
                u.is_active, 
                u.created_at
            FROM users u
            JOIN roles r ON u.role_id = r.id
            ORDER BY u.created_at DESC
        `;
        
        const [users] = await pool.query(query);
        
        res.json(users);
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ---------------------------------------------------------
// user/:id/role
// Updates a user's assigned role
// ---------------------------------------------------------
router.put('/users/:id/role', async (req, res) => {
    try {
        const { role_id } = req.body;
        await pool.query('UPDATE users SET role_id = ? WHERE id = ?', [role_id, req.params.id]);
        res.json({ message: "User role updated successfully" });
    } catch (err) {
        console.error("Error updating user role:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ---------------------------------------------------------
// user/users/:id/status
// Toggles a user's active/inactive status
// ---------------------------------------------------------
router.patch('/users/:id/status', async (req, res) => {
    try {
        const { is_active } = req.body;
        // Convert boolean to integer for MySQL compatibility if needed
        const activeStatus = is_active ? 1 : 0; 
        await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [activeStatus, req.params.id]);
        res.json({ message: "User status updated successfully" });
    } catch (err) {
        console.error("Error updating user status:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;