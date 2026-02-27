import express from "express";
import pool from "../db.js";
import { getActive } from "./global.js";
const router = express.Router();

router.get("/list", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        
        const { property_kind, status, taxable, search_term } = req.query;
        
        let where = "WHERE 1=1";
        const params = [];

        if (property_kind) {
            where += " AND td.property_kind = ?";
            params.push(property_kind);
        }
        if (status) {
            where += " AND td.status = ?";
            params.push(status);
        }
        if (taxable !== undefined && taxable !== '') {
            where += " AND td.taxable = ?";
            params.push(parseInt(taxable));
        }

        if (search_term) {
            where += ` AND (
                td.td_no LIKE ? OR 
                fa.faas_no LIKE ? OR 
                pm.arp_no LIKE ? OR 
                pm.pin LIKE ? OR 
                td.admin_name LIKE ?
            )`;
            const likeTerm = `%${search_term}%`;
            params.push(likeTerm, likeTerm, likeTerm, likeTerm, likeTerm);
        }

        // Count Query
        const countSql = `
            SELECT COUNT(*) AS total
            FROM taxdeclaration td
            LEFT JOIN faas fa ON fa.faas_id = td.faas_id
            LEFT JOIN propertymasterlist pm ON pm.property_id = td.property_id
            ${where}
        `;
        const [countRows] = await pool.query(countSql, params);
        const total = countRows[0].total;
        const totalPages = Math.ceil(total / limit);

        // Data Query
        const dataSql = `
            SELECT 
                td.td_id,
                td.td_no,
                td.property_kind,
                td.status,
                td.taxable,
                td.total_market_value,
                td.total_assessed_value,
                td.admin_name,
                td.barangay,
                td.created_at,
                fa.faas_no,
                pm.arp_no,
                pm.pin
            FROM taxdeclaration td
            LEFT JOIN faas fa ON fa.faas_id = td.faas_id
            LEFT JOIN propertymasterlist pm ON pm.property_id = td.property_id
            ${where}
            ORDER BY td.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [rows] = await pool.query(dataSql, [...params, limit, offset]);

        res.json({
            data: rows,
            pagination: {
                total_records: total,
                total_pages: totalPages,
                current_page: page,
                limit
            }
        });

    } catch (err) {
        console.error("TD list error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post('/create', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const data = req.body;

        if (!data.faas_id || !data.property_id || !data.td_no) {
            return res.status(400).json({ success: false, message: 'Missing required fields: faas_id, property_id, or td_no' });
        }

        await conn.beginTransaction();

        // 1. Insert Main Tax Declaration Record
        const [tdResult] = await conn.query(`
            INSERT INTO taxdeclaration (
                property_id, faas_id, td_no, property_identification_no,
                admin_name, admin_tin, admin_address, admin_contact_no,
                street, barangay, municipality, oct_no, survey_no, cct_no,
                lot_no, block_no, title_date, boundary_north, boundary_south,
                boundary_east, boundary_west, property_kind, total_market_value,
                total_assessed_value, taxable, assessment_effectivity_qtr,
                assessment_effectivity_year, memoranda, ordinance_no, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
        `, [
            data.property_id, data.faas_id, data.td_no, data.property_identification_no || null,
            data.admin_name || null, data.admin_tin || null, data.admin_address || null, data.admin_contact_no || null,
            data.street || null, data.barangay || null, data.municipality || null, data.oct_no || null, data.survey_no || null, data.cct_no || null,
            data.lot_no || null, data.block_no || null, data.title_date || null, data.boundary_north || null, data.boundary_south || null,
            data.boundary_east || null, data.boundary_west || null, data.property_kind, data.total_market_value || 0,
            data.total_assessed_value || 0, data.taxable ? 1 : 0, data.assessment_effectivity_qtr,
            data.assessment_effectivity_year, data.memoranda || null, data.ordinance_no || null
        ]);
        
        const td_id = tdResult.insertId;

        // 2. Transfer Owners from FAAS to Tax Declaration
        // This copies the owner snapshot exactly as it was during the FAAS creation
        await conn.query(`
            INSERT INTO taxdeclaration_owners (
                td_id, owner_id, last_name, first_name, middle_name, suffix, tin_no, email, address_house_no
            )
            SELECT 
                ?, owner_id, last_name, first_name, middle_name, suffix, tin_no, email, address_house_no
            FROM faas_owners 
            WHERE faas_id = ?
        `, [td_id, data.faas_id]);

        // 3. Transfer Assessment Summary
        // Adjust the SELECT fields based on your exact faasassessment and faasappraisal table structures
        if (data.property_kind === 'Land') {
            await conn.query(`
                INSERT INTO taxdeclaration_assessment (
                    td_id, classification, area, market_value, actual_use, assessment_level, assessed_value
                )
                SELECT 
                    ?, app.classification, app.area, ass.market_value, ass.actual_use, ass.assessment_level, ass.assessed_value
                FROM faasassessment ass
                LEFT JOIN faasappraisal app ON app.faas_id = ass.faas_id
                WHERE ass.faas_id = ?
            `, [td_id, data.faas_id]);
        } else {
            // For Building and Machinery (Area and Classification might not apply the same way, falling back to core assessment)
            await conn.query(`
                INSERT INTO taxdeclaration_assessment (
                    td_id, market_value, actual_use, assessment_level, assessed_value
                )
                SELECT 
                    ?, market_value, actual_use, assessment_level, assessed_value
                FROM faasassessment
                WHERE faas_id = ?
            `, [td_id, data.faas_id]);
        }

        await conn.commit();
        res.json({ success: true, td_id, message: 'Tax Declaration created successfully!' });

    } catch (error) {
        await conn.rollback();
        console.error("TD Creation Error:", error);
        res.status(500).json({ success: false, message: 'Failed to create Tax Declaration.', error: error.message });
    } finally {
        conn.release();
    }
});

router.get("/:id", async (req, res) => {
    try {
        const tdId = parseInt(req.params.id);

        if (!tdId || isNaN(tdId)) {
            return res.status(400).json({ success: false, message: "Invalid Tax Declaration ID." });
        }

        // 1. Fetch Main Tax Declaration Data
        const [tdRows] = await pool.query(
            `SELECT * FROM taxdeclaration WHERE td_id = ?`, 
            [tdId]
        );

        if (tdRows.length === 0) {
            return res.status(404).json({ success: false, message: "Tax Declaration not found." });
        }

        const td = tdRows[0];

        // 2. Concurrently fetch related Owners and Assessments for speed
        const [
            [ownersRows],
            [assessmentRows]
        ] = await Promise.all([
            pool.query(
                `SELECT * FROM taxdeclaration_owners WHERE td_id = ?`, 
                [tdId]
            ),
            pool.query(
                `SELECT * FROM taxdeclaration_assessment WHERE td_id = ?`, 
                [tdId]
            )
        ]);

        // 3. Construct and send the response
        res.json({
            success: true,
            td: td,
            owners: ownersRows,
            assessment: assessmentRows
        });

    } catch (err) {
        console.error("TD fetch error:", err);
        res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
});


export default router;