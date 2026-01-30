import express from "express";
import pool from "../db.js";
import { getActive } from "./global.js";
const router = express.Router();

// --- CREATE a building item ---
router.post('/', async (req, res) => {
    try {
        const { item_name, description } = req.body;
        const [result] = await pool.query(
        'INSERT INTO building_items (item_name, description) VALUES (?, ?)',
        [item_name, description || null]
        );
        res.json({ success: true, insertedId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- READ all active building items ---
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(
        'SELECT * FROM building_items WHERE is_active = 1'
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// --- UPDATE a building item ---
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { item_name, description, is_active } = req.body;
        const [result] = await pool.query(
        'UPDATE building_items SET item_name = ?, description = ?, is_active = ? WHERE item_id = ?',
        [item_name, description, is_active ?? 1, id]
        );
        res.json({ success: true, affectedRows: result.affectedRows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- DELETE a building item (soft delete by default) ---
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query(
        'UPDATE building_items SET is_active = 0 WHERE item_id = ?',
        [id]
        );
        res.json({ success: true, affectedRows: result.affectedRows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/uv/', async (req, res) => {
    try {
        const [rows] = await pool.query(
        ` 
            SELECT 
                uv.*,
                (SELECT item_name FROM building_items WHERE item_id = uv.item_id ) AS item_name
            FROM unit_values uv`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// --- CREATE a unit value ---
router.post('/uv', async (req, res) => {
    try {
        const { item_id, unit_value, effective_year } = req.body;
        const active = await getActive();
        const [result] = await pool.query(
        'INSERT INTO unit_values (item_id, ry_id, unit_value, effective_year) VALUES (?, ?, ?, ?)',
        [item_id, active, unit_value, effective_year]
        );
        res.json({ success: true, insertedId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- READ unit values by item ---
router.get('/uv/:item_id', async (req, res) => {
    try {
        const { item_id } = req.params;
        const [rows] = await pool.query(
        'SELECT * FROM unit_values WHERE item_id = ?',
        [item_id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// --- UPDATE a unit value ---
router.put('/uv/:value_id', async (req, res) => {
    try {
        const { value_id } = req.params;
        const { unit_value, effective_year } = req.body;
        const [result] = await pool.query(
        'UPDATE unit_values SET unit_value = ?, effective_year = ? WHERE value_id = ?',
        [unit_value, effective_year, value_id]
        );
        res.json({ success: true, affectedRows: result.affectedRows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- DELETE a unit value ---
router.delete('/uv/:value_id', async (req, res) => {
    try {
        const { value_id } = req.params;
        const [result] = await pool.query(
        'DELETE FROM unit_values WHERE value_id = ?',
        [value_id]
        );
        res.json({ success: true, affectedRows: result.affectedRows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
