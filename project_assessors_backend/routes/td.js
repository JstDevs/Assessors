import express from "express";
import pool from "../db.js";
import { getActive } from "./global.js";
const router = express.Router();

router.post("/create", async (req, res) => {
    try {
        const {
            faas_id,
            td_no,
            effectivity_date,
            owner_name,
            owner_address,
            property_location,
            property_kind,
            market_value,
            assessment_level,
            assessed_value,
            taxable,
            created_by,
        } = req.body;

        if (!faas_id || !td_no)
            return res.status(400).json({ error: "Missing required fields" });

        //Check if FAAS exists
        const [faasRows] = await pool.query(
            `SELECT property_id FROM FAAS WHERE faas_id = ? LIMIT 1`,
            [faas_id]
        );
        if (faasRows.length === 0)
            return res.status(404).json({ error: "FAAS not found." });

        const property_id = faasRows[0].property_id;

        // Check if this FAAS already has a TD
        const [existing] = await pool.query(
            `SELECT td_id FROM TaxDeclaration WHERE faas_id = ? LIMIT 1`,
            [faas_id]
        );
        if (existing.length > 0)
            return res
                .status(400)
                .json({ error: "This FAAS already has an existing Tax Declaration." });

        //Cancel all other active TDs for the same property
        await pool.query(
            `UPDATE TaxDeclaration 
             SET status = 'CANCELLED' 
             WHERE faas_id IN (
                 SELECT faas_id FROM FAAS WHERE property_id = ?
             ) AND status = 'ACTIVE'`,
            [property_id]
        );

        //Create the new TD
        const [result] = await pool.query(
            `INSERT INTO TaxDeclaration 
                (faas_id, td_no, effectivity_date, owner_name, owner_address, 
                 property_location, property_kind, market_value, 
                 assessment_level, assessed_value, taxable, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                faas_id,
                td_no,
                effectivity_date,
                owner_name,
                owner_address,
                property_location,
                property_kind,
                market_value,
                assessment_level,
                assessed_value,
                taxable,
                created_by,
            ]
        );

        res.json({
            message: "Tax Declaration created successfully.",
            td_id: result.insertId,
        });
    } catch (err) {
        console.error("Error creating Tax Declaration:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/list/:faas_id", async (req, res) => {
    const { faas_id } = req.params;

    try {
        const [rows] = await pool.query(`
            SELECT 
                td_id,
                faas_id,
                td_no,
                effectivity_date,
                owner_name,
                owner_address,
                property_location,
                property_kind,
                market_value,
                assessment_level,
                assessed_value,
                taxable,
                status,
                created_by,
                created_date
            FROM TaxDeclaration
            WHERE faas_id = ?
            ORDER BY created_date DESC
        `, [faas_id]);

        res.status(200).json(rows);
    } catch (err) {
        console.error("Error fetching Tax Declarations:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/aroll", async (req, res) => {
    try {
        const { barangay, lot_no, block_no, owner_name, property_kind, revision_year } = req.query;

        //Base query
        let query = `
            SELECT 
                r.year AS revision_year,
                pm.barangay,
                pm.lot_no,
                pm.block_no,
                td.td_no,
                td.owner_name,
                td.property_kind,
                td.market_value,
                td.assessed_value,
                td.effectivity_date,
                td.status
            FROM TaxDeclaration td
            JOIN FAAS f ON td.faas_id = f.faas_id
            JOIN RevisionYear r ON f.ry_id = r.ry_id
            JOIN PropertyMasterList pm ON f.property_id = pm.property_id
            WHERE td.status = 'ACTIVE'
        `;

        const params = [];

        //Apply filters dynamically
        if (barangay) {
            query += ` AND pm.barangay = ?`;
            params.push(`${barangay}`);
        }
        if (lot_no) {
            query += ` AND pm.lot_no LIKE ?`;
            params.push(`%${lot_no}%`);
        }
        if (block_no) {
            query += ` AND pm.block_no LIKE ?`;
            params.push(`%${block_no}%`);
        }
        if (owner_name) {
            query += ` AND td.owner_name LIKE ?`;
            params.push(`%${owner_name}%`);
        }
        if (property_kind) {
            query += ` AND td.property_kind = ?`;
            params.push(property_kind);
        }
        if (revision_year) {
            query += ` AND r.year = ?`;
            params.push(revision_year);
        }

        //Sorting (optional)
        query += ` ORDER BY pm.barangay, td.owner_name`;

        const [rows] = await pool.query(query, params);

        res.json({ count: rows.length, data: rows });
    } catch (err) {
        console.error("Error fetching Assessment Roll:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get('/count', async (req, res)=>{
    try{
        const sql = "SELECT COUNT(*) AS total FROM taxdeclaration WHERE status = 'ACTIVE'";
        const [total] = await pool.query(sql, []);
        res.json({success: true, message: "Returned Total Count", data: total[0]});
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});


//filters



export default router;
