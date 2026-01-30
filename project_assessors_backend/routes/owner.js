import express from "express";
import pool from "../db.js";
import { getActive } from "./global.js";
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM owner_information ORDER BY last_name`
        );
        res.json(rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Failed to load owners' });
    }
});

router.get('/available', async (req, res) => {
    const { ids } = req.query;
    const parsedIds = ids.split(',');
    try {
        const [rows] = await pool.query(
            `
                SELECT *
                FROM owner_information
                WHERE owner_id NOT IN (?)
                ORDER BY last_name
            `,
            [parsedIds]
        );
        res.json(rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Failed to load owners' });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM owner_information WHERE owner_id = ? LIMIT 1",
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Owner not found" });
        }

        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

router.post('/', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const data = req.body;

        await conn.beginTransaction();

        const [result] = await conn.query(
            `INSERT INTO owner_information
            (last_name, first_name, middle_name, suffix,
             tin_no, email, contact_no,
             address_house_no, is_active, remarks)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.last_name,
                data.first_name,
                data.middle_name,
                data.suffix,
                data.tin_no,
                data.email,
                data.contact_no,
                data.address_house_no, 
                data.is_active,
                data.remarks
            ]
        );

        const newId = result.insertId;

        // Log CREATE history
        // for (const [field, value] of Object.entries(data)) {
        //     await conn.query(
        //         `INSERT INTO owner_history
        //         (owner_id, field_name, old_value, new_value, action_type, changed_by)
        //         VALUES (?, ?, NULL, ?, 'CREATE', ?)`,
        //         [newId, field, value, data.created_by || 'system']
        //     );
        // }
        await conn.query(
            `INSERT INTO owner_history
            (owner_id, field_name, old_value, new_value, action_type, changed_by)
            VALUES (?, ?, ?, ?, 'CREATE', ?)`,
            [newId, 'New Owner', 'Record', 'Record', data.created_by || 'system']
        );

        await conn.commit();

        res.json({ message: 'Owner created', owner_id: newId });

    } catch (err) {
        await conn.rollback();
        console.log(err);
        res.status(500).json({ message: 'Create failed' });
    } finally {
        conn.release();
    }
});

router.put('/:id', async (req, res) => {
    const owner_id = req.params.id;
    const updates = req.body;

    const conn = await pool.getConnection();

    try {
        // Fetch old record
        const [rows] = await conn.query(
            `SELECT * FROM owner_information WHERE owner_id = ?`,
            [owner_id]
        );

        if (!rows.length)
            return res.status(404).json({ message: 'Owner not found' });

        const oldData = rows[0];

        await conn.beginTransaction();

        // Update owner
        await conn.query(
            `UPDATE owner_information SET
                last_name = ?, first_name = ?, middle_name = ?, suffix = ?,
                tin_no = ?, email = ?, contact_no = ?,
                address_house_no = ?, is_active = ?, remarks = ?
             WHERE owner_id = ?`,
            [
                updates.last_name,
                updates.first_name,
                updates.middle_name,
                updates.suffix,

                updates.tin_no,
                updates.email,
                updates.contact_no,

                updates.address_house_no,
                updates.is_active,
                updates.remarks,

                owner_id
            ]
        );

        // Compare fields → Create history logs
        for (const key of Object.keys(updates)) {
            if(key === 'created_at' || key === 'updated_at') continue;
            const oldVal = oldData[key];
            const newVal = updates[key];

            if (String(oldVal) !== String(newVal)) {
                await conn.query(
                    `INSERT INTO owner_history
                    (owner_id, field_name, old_value, new_value, action_type, changed_by)
                    VALUES (?, ?, ?, ?, 'UPDATE', ?)`,
                    [
                        owner_id,
                        key,
                        oldVal,
                        newVal,
                        updates.updated_by || 'system'
                    ]
                );
            }
        }

        await conn.commit();

        res.json({ message: 'Owner updated successfully' });

    } catch (err) {
        await conn.rollback();
        console.log(err);
        res.status(500).json({ message: 'Update failed' });
    } finally {
        conn.release();
    }
});

router.get("/history/:id", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM owner_history WHERE owner_id = ? ORDER BY changed_at DESC",
            [req.params.id]
        );

        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});


export default router;

