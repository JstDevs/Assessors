import express from "express";
import pool from "../db.js";
import { getActive } from "./global.js";
const router = express.Router();


router.post("/", async (req, res) => {
    try {
        const { transaction_name, transaction_code, transaction_description } = req.body;

        const [result] = await pool.query(
            `INSERT INTO transactionalcodes 
            (transaction_name, transaction_code, transaction_description)
            VALUES (?, ?, ?)`,
            [transaction_name, transaction_code, transaction_description]
        );

        res.json({ message: "Created", tc_id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT * FROM TransactionalCodes ORDER BY tc_id DESC`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM TransactionalCodes WHERE tc_id = ?`,
            [req.params.id]
        );

        if (rows.length === 0) return res.status(404).json({ error: "Not found" });

        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const { trasaction_name, transaction_code, transaction_description } = req.body;

        const [result] = await pool.query(
            `UPDATE TransactionalCodes
             SET trasaction_name = ?, transaction_code = ?, transaction_description = ?
             WHERE tc_id = ?`,
            [trasaction_name, transaction_code, transaction_description, req.params.id]
        );

        if (result.affectedRows === 0)
            return res.status(404).json({ error: "Not found" });

        res.json({ message: "Updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
