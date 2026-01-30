import express from "express";
import pool from "../db.js";

const router = express.Router();
const table = "RevisionYear";


router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT * FROM ${table}`);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database query failed" });
    }
});

router.get("/list", async (req, res)=>{
    try{
        const [result] = await pool.query(`SELECT * FROM ${table} ORDER BY ry_id DESC`);
        res.json(result);
    }catch(err){
        res.status(500).json({error: "Internal Server Error!"});
        console.log(err);
    }
});

router.get("/active", async (req, res)=>{
    try{
        const [result] = await pool.query(`SELECT year FROM ${table} WHERE active = 1 ORDER BY created_at ASC`);
        res.json(result[0].year);
    }catch(err){
        console.log(err);
        res.status(500).json({ error: "Internal Server Failed" });
    }
});

router.post("/create", async(req, res) =>{
    try{
        const { 
            rc, year, td_pref, desc, 
            city_ass, city_pos, ass_city_ass, ass_city_pos,
            pro_ass, pro_pos, s_date, e_date, by 
        } = req.body;

        const sql = `
            INSERT INTO ${table} 
            (revision_code, year, td_prefix, description, city_assessor_name, city_assessor_position, asst_city_assessor_name, asst_city_assessor_position, 
            provincial_assessor_name, provincial_assessor_position, start_date, end_date, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            rc, year, td_pref, desc, 
            city_ass, city_pos, ass_city_ass, ass_city_pos,
            pro_ass, pro_pos, s_date, e_date, by
        ];

        const [result] = await pool.query(sql, values);

        res.json({ success: true, insertedId: result.insertId });
    }catch(err){
        res.status(500).json({error: "Internal Server Error."});
        console.log(err);
    }
});

router.put("/update", async (req, res) => {
    try{
        const { 
            ry_id, rc, year, td_pref, desc, 
            city_ass, city_pos, ass_city_ass, ass_city_pos,
            pro_ass, pro_pos, s_date, e_date, by 
        } = req.body;

        const sql = `
                UPDATE ${table}
                SET 
                    revision_code = ?,
                    year = ?,
                    td_prefix = ?,
                    description = ?,
                    city_assessor_name = ?,
                    city_assessor_position = ?,
                    asst_city_assessor_name = ?,
                    asst_city_assessor_position = ?,
                    provincial_assessor_name = ?,
                    provincial_assessor_position = ?,
                    start_date = ?,
                    end_date = ?,
                    created_by = ?
                WHERE ry_id = ?
            `;


        const values = [
            rc, year, td_pref, desc, 
            city_ass, city_pos, ass_city_ass, ass_city_pos,
            pro_ass, pro_pos, s_date, e_date, by, ry_id
        ];

        const [result] = await pool.query(sql, values);

        res.json({ 
            success: true, 
            affectedRows: result.affectedRows
        });

    }catch(err){
        res.status(500).json({error: "Internal Server Error!"});
        console.log(err);
    }
    

})

router.delete("/remove", async (req, res) => {
    try {
        const { ry_id } = req.query;
        if (!ry_id) {
        return res.status(400).json({ error: "ry_id is required" });
        }

        const sql = `DELETE FROM ${table} WHERE ry_id = ?`;
        const [result] = await pool.query(sql, [ry_id]);

        res.json({
            success: true,
            deletedCount: result.affectedRows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error!" });
    }
});

router.put("/active", async (req, res) => {
    try {
        const { ry_id } = req.body;

        if (!ry_id) {
        return res.status(400).json({ error: "ry_id is required" });
        }

        // Consider wrapping in a transaction to avoid partial updates
        const sql1 = `UPDATE ${table} SET active = 0`;
        const [result1] = await pool.query(sql1);

        const sql2 = `UPDATE ${table} SET active = 1 WHERE ry_id = ?`;
        const [result2] = await pool.query(sql2, [ry_id]);

        return res.json({
        success: true,
        affectedRows1: result1.affectedRows,
        affectedRows2: result2.affectedRows,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error!" });
    }
});



export default router;


