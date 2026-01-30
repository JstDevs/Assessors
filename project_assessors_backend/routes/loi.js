import express from "express";
import pool from "../db.js";
import { getActive } from "./global.js";
const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { improvement_name, description } = req.body;
        const [result] = await pool.query(
        'INSERT INTO land_improvements (improvement_name, description) VALUES (?, ?)',
        [improvement_name, description || null]
        );
        res.json({ success: true, insertedId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(
        'SELECT * FROM land_improvements WHERE is_active = 1'
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { improvement_name, description, is_active } = req.body;
        const [result] = await pool.query(
        'UPDATE land_improvements SET improvement_name = ?, description = ?, is_active = ? WHERE improvement_id = ?',
        [improvement_name, description, is_active ?? 1, id]
        );
        res.json({ success: true, affectedRows: result.affectedRows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query(
        'UPDATE land_improvements SET is_active = 0 WHERE item_id = ?',
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
                (SELECT improvement_name FROM land_improvements WHERE improvement_id = uv.improvement_id ) AS improvement_name
            FROM improvements_unit_value uv`
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
        const { improvement_id, unit_value, effective_year } = req.body;
        const active = await getActive();
        const [result] = await pool.query(
        'INSERT INTO improvements_unit_value (improvement_id, ry_id, unit_value, effective_year) VALUES (?, ?, ?, ?)',
        [improvement_id, active, unit_value, effective_year]
        );
        res.json({ success: true, insertedId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- READ unit values by item ---
router.get('/uv/:improvement_id', async (req, res) => {
    try {
        const { improvement_id } = req.params;
        const [rows] = await pool.query(
        'SELECT * FROM improvements_unit_value WHERE improvement_id = ?',
        [improvement_id]
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
        'UPDATE improvements_unit_value SET unit_value = ?, effective_year = ? WHERE value_id = ?',
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
        'DELETE FROM improvements_unit_value WHERE value_id = ?',
        [value_id]
        );
        res.json({ success: true, affectedRows: result.affectedRows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
