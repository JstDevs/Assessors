import express from "express";
import pool from "../db.js";
import { getActive } from "./global.js";

const router = express.Router();
const lvg = "locationalgroup";

router.get('/list', async (req, res) => {
    try{
        const active = await getActive();
        const sql = `SELECT * FROM ${lvg} WHERE ry_id = ? ORDER BY active`
        const [response] = await pool.query(sql, [active]);

        res.json({success: true, message: "list fetched successfully!", data: response});
    }catch(err){
        console.log(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});


router.get('/getID', async (req, res) => {
    try{
        const active = await getActive();
        const { code } = req.query;
        const sql = `SELECT * FROM ${lvg} WHERE code = ? AND ry_id = ?`
        const [response] = await pool.query(sql, [code, active]);
        res.json(response[0]);
    }catch(err){
        console.log(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});

router.get('/get', async (req, res)=>{
    try{
        const { lg_id } = req.query;
        const sql = `SELECT * FROM ${lvg} WHERE lg_id = ?`;
        const [result] = await pool.query(sql, [lg_id]);
        res.json({success: true, message: "Query Success!", data: result[0]});
    }catch(err){
        console.log(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
})

router.get('/getOptions', async (req, res)=>{
    try{
        const active = await getActive();
        const sql = `SELECT lg_id, name FROM ${lvg} WHERE ry_id = ?`;
        const [result] = await pool.query(sql, [active]);
        res.json({success: true, message: "Query Success!", data: result});
    }catch(err){
        console.log(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
})

router.post('/add', async (req, res) => {
    try{
        const active = await getActive();
        const { code, name, description, zone_type } = req.body;
        const sql = `INSERT INTO ${lvg}(ry_id, code, name, description, zone_type) VALUES(?, ?, ?, ?, ?)`;
        const [result] = await pool.query(sql, [active, code, name, description, zone_type]);

        res.json({success:true, message: "Successfully created!"});
    }catch(err){
        console.log(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});

router.put('/update', async (req, res) => {
    try {
        const { lg_id, code, name, description, zone_type } = req.body;

        const sql = `UPDATE ${lvg} 
                     SET code = ?, name = ?, description = ?, zone_type = ?
                     WHERE lg_id = ?`;
        const [result] = await pool.query(sql, [code, name, description, zone_type, lg_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Record not found" });
        }

        res.json({ success: true, message: "Record updated successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Internal Server Error!" });
    }
});

router.delete('/delete', async (req, res) => {
    try {
        const { lg_id } = req.query;

        const sql = `DELETE FROM ${lvg} WHERE lg_id = ?`;
        const [result] = await pool.query(sql, [lg_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Record not found" });
        }

        res.json({ success: true, message: "Record deleted successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Internal Server Error!" });
    }
});

router.get("/barangayList", async (req, res) => {
    try {
        const { lg_id } = req.query;
        let query = `SELECT barangay_id, barangay_name, lg_id FROM Barangay WHERE status = 1`;
        const params = [];

        if (lg_id) {
            query += ` AND lg_id = ?`;
            params.push(lg_id);
        }

        query += ` ORDER BY barangay_name`;

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching barangay list:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post("/barangay", async (req, res) => {
    try {
        const { barangay_name, short_name = "", lg_id } = req.body;

        if (!barangay_name || !lg_id)
            return res.status(400).json({ error: "Missing required fields" });

        // 🔍 Check barangay count globally
        const [barangayCount] = await pool.query(
            `SELECT COUNT(*) AS count FROM Barangay WHERE barangay_name = ?`,
            [barangay_name]
        );

        if (barangayCount[0].count >= 2) {
            return res.status(400).json({
                error: "This barangay name already exists twice in the system.",
            });
        }

        // 🔍 Check if barangay already exists under this LG
        const [existingSameLG] = await pool.query(
            `SELECT barangay_id FROM Barangay WHERE barangay_name = ? AND lg_id = ?`,
            [barangay_name, lg_id]
        );

        if (existingSameLG.length > 0) {
            return res.status(400).json({
                error: "This barangay already exists under the same LG.",
            });
        }

        // 🆕 Insert if checks pass
        const [result] = await pool.query(
            `INSERT INTO Barangay (barangay_name, short_name, lg_id) VALUES (?, ?, ?)`,
            [barangay_name, short_name, lg_id]
        );

        res.json({
            message: "Barangay added successfully.",
            barangay_id: result.insertId,
        });
    } catch (err) {
        console.error("Error adding barangay:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.put("/barangay", async (req, res) => {
    try {
        const { barangay_id } = req.body;
        console.log(barangay_id)

        // 🚫 Set status to INACTIVE
        await pool.query(
            `UPDATE Barangay SET status = 0 WHERE barangay_id = ?`,
            [barangay_id]
        );

        res.json({ message: "Barangay set to INACTIVE successfully." });
    } catch (err) {
        console.error("Error updating barangay status:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/listUnique", async (req, res) => {
    try {
        let query = `SELECT DISTINCT barangay_name FROM Barangay WHERE status = 1`;
        query += ` ORDER BY barangay_name`;

        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching barangay list:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;