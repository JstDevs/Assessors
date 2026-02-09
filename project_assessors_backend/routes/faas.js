import express from "express";
import pool from "../db.js";
import { getActive } from "./global.js";
const router = express.Router();

// router.get('/history', async (req, res) => {
//     try {
//         const { property_id } = req.query;
//         const [rows] = await pool.query(`
//             SELECT * FROM faas WHERE property_id = ? ORDER BY created_date DESC
//         `, [property_id]);
//         res.json({success: true, message: "List fetch successfully", data: rows});
//     } catch (err) {
//         console.log(err);
//         res.status(500).json({ error: err.message });
//     }
// });


// router.get('/allDetails', async (req, res) => {
//     try {
//         const { faas_id } = req.query;
//         if (!faas_id)
//             return res.status(400).json({ error: 'faas_id is required' });
//         const [rows] = await pool.query(`
//             SELECT 
//                 f.faas_id,
//                 f.property_id,
//                 f.ry_id,
//                 f.faas_no,
//                 f.faas_type,
//                 f.effectivity_date,
//                 f.previous_faas_id,
//                 f.taxable,
//                 f.remarks,
//                 f.status,
//                 f.created_by,
//                 f.created_date,
                
//                 d.property_kind,
//                 d.market_value,
//                 d.assessment_level,
//                 d.assessed_value,
//                 d.notes,

//                 pm.arp_no,
//                 pm.pin,
//                 pm.owner_name,
//                 pm.owner_address,
//                 pm.barangay,
//                 pm.lot_no,
//                 pm.block_no,
//                 pm.property_kind AS master_property_kind,
//                 ry.year,
                
//                 ff.faas_no AS old_faas
//             FROM FAAS f
//             JOIN FAAS_Detail d ON f.faas_id = d.faas_id
//             JOIN PropertyMasterList pm ON f.property_id = pm.property_id
//             LEFT JOIN FAAS ff ON ff.faas_id = f.previous_faas_id
//             JOIN RevisionYear ry ON f.ry_id = ry.ry_id
//             WHERE f.faas_id = ?
//             LIMIT 1;
//         `, [faas_id]);

//         if (rows.length === 0)
//             return res.status(404).json({ error: 'FAAS not found' });

//         res.json(rows[0]);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// router.get('/details', async (req, res) => {
//     try {
//         const { faas_id } = req.query;
//         const [rows] = await pool.query(`
//             SELECT * FROM faas_detail WHERE faas_id = ?
//         `, [faas_id]);
//         res.json({success: true, message: "details fetched successfully", data: rows});
//     } catch (err) {
//         console.log(err);
//         res.status(500).json({ error: err.message });
//     }
// });

// Create new FAAS + FAAS_Detail
// router.post('/create', async (req, res) => {
//     const connection = await pool.getConnection();
//     try {
//         const {
//             property_id,
//             ry_id,
//             faas_type = 'ORIGINAL',
//             effectivity_date,
//             taxable = true,
//             remarks = null,
//             created_by = "DEV",
//             property_kind,        
//             market_value,
//             assessment_level,
//             status = "ACTIVE"
//         } = req.body;

//         // if (!property_id || !ry_id || !effectivity_date || !property_kind || !market_value || !assessment_level)
//         //     return res.status(400).json({ error: "Missing required fields." });

//         await connection.beginTransaction();

//         // 🔹 Step 1: Find the most recent ACTIVE FAAS for this property & kind
//         const [prevFAAS] = await connection.query(`
//             SELECT f.faas_id
//             FROM FAAS f
//             JOIN FAAS_Detail d ON f.faas_id = d.faas_id
//             WHERE f.property_id = ? AND d.property_kind = ? AND f.status = 'ACTIVE'
//             ORDER BY f.created_date DESC
//             LIMIT 1
//         `, [property_id, property_kind]);

//         const previous_faas_id = prevFAAS.length ? prevFAAS[0].faas_id : null;

//         // 🔹 Step 2: Mark all existing FAAS for that property & kind as INACTIVE
//         await connection.query(`
//             UPDATE FAAS f
//             JOIN FAAS_Detail d ON f.faas_id = d.faas_id
//             SET f.status = 'INACTIVE'
//             WHERE f.property_id = ? AND d.property_kind = ? AND f.status = 'ACTIVE'
//         `, [property_id, property_kind]);

//         // 🔹 Step 3: Auto-generate FAAS number
//         const faas_no = `RY${ry_id}-P${property_id}-${Date.now()}`;

//         // 🔹 Step 4: Insert new FAAS record (linking to the previous FAAS if it exists)
//         const [faasResult] = await connection.query(`
//             INSERT INTO FAAS
//             (property_id, ry_id, faas_no, faas_type, effectivity_date, previous_faas_id,
//              taxable, remarks, created_by, status)
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
//         `, [
//             property_id, ry_id, faas_no, faas_type, effectivity_date,
//             previous_faas_id, taxable, remarks, created_by
//         ]);

//         const faas_id = faasResult.insertId;

//         // 🔹 Step 5: Insert FAAS detail
//         await connection.query(`
//             INSERT INTO FAAS_Detail
//             (faas_id, property_kind, market_value, assessment_level, notes)
//             VALUES (?, ?, ?, ?, ?)
//         `, [
//             faas_id, property_kind, market_value, assessment_level, notes
//         ]);

//         await connection.commit();

//         res.status(201).json({
//             message: "FAAS created successfully and linked to previous record.",
//             faas_id,
//             faas_no,
//             previous_faas_id
//         });

//     } catch (err) {
//         await connection.rollback();
//         console.error(err);
//         res.status(500).json({ error: "Internal Server Error" });
//     } finally {
//         connection.release();
//     }
// });

// router.post('/create', async (req, res) => {
//     try {
//         const {
//         property_id,
//         ry_id,
//         faas_type = 'ORIGINAL',
//         effectivity_date,
//         taxable = 1,
//         remarks = null,
//         status = 'ACTIVE',
//         created_by = null
//         } = req.body.faas;

//         if (!property_id || !ry_id || !effectivity_date) {
//         return res.status(400).json({ message: 'Missing required fields.' });
//         }

//         // 1️⃣ Find the latest existing FAAS for this property
//         const [existing] = await pool.query(
//         `SELECT faas_id, faas_no FROM faas 
//         WHERE property_id = ? 
//         ORDER BY created_date DESC 
//         LIMIT 1`,
//         [property_id]
//         );

//         let previous_faas_id = null;
//         if (existing.length > 0) {
//         previous_faas_id = existing[0].faas_id;
//         }

//         // 2️⃣ Insert new record without faas_no (we’ll generate it next)
//         const insertSql = `
//         INSERT INTO faas (
//             property_id, ry_id, faas_no, faas_type,
//             effectivity_date, previous_faas_id, taxable,
//             remarks, status, created_by
//         )
//         VALUES (?, ?, '', ?, ?, ?, ?, ?, ?, ?)
//         `;

//         const [insertResult] = await pool.query(insertSql, [
//         property_id,
//         ry_id,
//         faas_type,
//         effectivity_date,
//         previous_faas_id,
//         taxable,
//         remarks,
//         status,
//         created_by
//         ]);

//         const newId = insertResult.insertId;

//         // 3️⃣ Generate FAAS number
//         const generatedFaasNo = `FAAS-${String(newId).padStart(5, '0')}`;

//         // 4️⃣ Update record with generated FAAS number
//         await pool.query(`UPDATE faas SET faas_no = ? WHERE faas_id = ?`, [generatedFaasNo, newId]);

//         res.status(201).json({
//         message: 'FAAS created successfully',
//         faas_id: newId,
//         faas_no: generatedFaasNo,
//         previous_faas_id,
//         previous_faas_no: existing.length > 0 ? existing[0].faas_no : null
//         });
//     } catch (error) {
//         console.error('Error creating FAAS:', error);
//         res.status(500).json({ message: 'Error creating FAAS', error: error.message });
//     }
// });



router.get('/active', async (req, res) => {
    try {
        const { property_id } = req.query;
        if (!property_id)
            return res.status(400).json({ error: 'property_id is required' });

        const [rows] = await pool.query(`
            SELECT f.faas_id
            FROM FAAS f
            WHERE f.property_id = ?
              AND f.status = 'ACTIVE'
            ORDER BY f.effectivity_date DESC
            LIMIT 1;
        `, [property_id]);

        res.json({ faas_id: rows[0]?.faas_id | 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get("/list", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        
        const { faas_type, status, ry_id, property_kind } = req.query;
        
        let where = "WHERE 1=1";
        const params = [];

        // Filters for FAAS table only
        if (faas_type) {
            where += " AND faas_type = ?";
            params.push(faas_type);
        }
        if (status) {
            where += " AND fa.status = ?";
            params.push(status);
        }
        if (ry_id) {
            where += " AND ry_id = ?";
            params.push(ry_id);
        }

        if(property_kind){
            where += " AND fa.property_kind = ?";
            params.push(property_kind);
        }

        // Count
        const countSql = `
            SELECT COUNT(*) AS total
            FROM FAAS fa
            ${where}
        `;
        const [countRows] = await pool.query(countSql, params);
        const total = countRows[0].total;
        const totalPages = Math.ceil(total / limit);

        // Data
        const dataSql = `
            SELECT 
                fa.faas_id,
                fa.property_id,
                fa.ry_id,
                fa.faas_no,
                fa.faas_type,
                fa.effectivity_date,
                fa.previous_faas_id,
                fa.status,
                fa.created_by,
                fa.created_date,
                fa.property_kind,
                pm.arp_no
            FROM FAAS fa
            LEFT JOIN propertymasterlist pm ON pm.property_id = fa.property_id
            ${where}
            ORDER BY created_date DESC
            LIMIT ? OFFSET ?
        `;

        // console.log(dataSql);

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
        console.error("FAAS list error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get('/listOptions', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { status, property_kind } = req.query;

        // Build dynamic query based on filters
        let query = `
            SELECT 
                f.faas_id, 
                f.faas_no, 
                f.owner_name, 
                f.owner_address, 
                f.lg_code, 
                f.property_kind, 
                f.status
            FROM faas f
            WHERE 1=1
        `;
        
        const params = [];

        if (status) {
            query += ` AND f.status = ?`;
            params.push(status);
        }

        if (property_kind) {
            query += ` AND f.property_kind = ?`;
            params.push(property_kind);
        }

        // Sort by FAAS No for easier finding in dropdown
        query += ` ORDER BY f.faas_no ASC`;

        const [rows] = await conn.query(query, params);

        res.json(rows);

    } catch (err) {
        console.error("Error fetching FAAS list:", err);
        res.status(500).json({ message: 'Failed to fetch property list', error: err.message });
    } finally {
        conn.release();
    }
});

async function get_faas_details(kind, faas_id, connection){
    const data = {};
    if (kind === 'Land') {
        const [appraisal] = await connection.query(
            `SELECT * FROM faasappraisal WHERE faas_id = ?`, [faas_id]
        );
        const [assessment] = await connection.query(
            `SELECT * FROM faasassessment WHERE faas_id = ?`, [faas_id]
        );
        const [adjustments] = await connection.query(
            `SELECT * FROM faasadjustments WHERE faas_id = ?`, [faas_id]
        );
        const [improvements] = await connection.query(
            `SELECT * FROM faasimprovements WHERE faas_id = ?`, [faas_id]
        );
        data.land = {
            appraisal: appraisal[0] || null,
            assessment: assessment[0] || null,
            adjustments: adjustments || [],
            improvements: improvements || []
        };
    }
    if (kind === 'Building') {

        const [general] = await connection.query(
            `SELECT * FROM faasbldggeneral WHERE faas_id = ?`, [faas_id]
        );
        const [floors] = await connection.query(
            `SELECT * FROM faasbldgfloorsarea WHERE faas_id = ?`, [faas_id]
        );
        const [materials] = await connection.query(
            `SELECT * FROM faasbldgstruturalmaterials WHERE faas_id = ?`, [faas_id]
        );
        const [bapp] = await connection.query(
            `SELECT * FROM faasbldgappraisal WHERE faas_id = ?`, [faas_id]
        );
        const [bass] = await connection.query(
            `SELECT * FROM faasbldgassessment WHERE faas_id = ?`, [faas_id]
        );
        const [add] = await connection.query(
            `SELECT * FROM faasbldgadditionalitems WHERE faas_id = ?`, [faas_id]
        );

        data.building = {
            general: general[0] || null,
            floors: floors || [],
            materials: materials || [],
            appraisal: bapp[0] || null,
            assessment: bass[0] || null,
            additionals: add || []
        };
    }
    if (kind === 'Machinery') {
        const [mapp] = await connection.query(
            `SELECT * FROM faasmachineryappraisal WHERE faas_id = ?`, [faas_id]
        );
        const [mass] = await connection.query(
            `SELECT * FROM faasmachineryassessment WHERE faas_id = ?`, [faas_id]
        );

        data.machinery = {
            appraisal: mapp[0] || null,
            assessment: mass[0] || null
        };
    }
    return data;
}

router.get('/:faas_id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { faas_id } = req.params;

        // 1. Fetch FAAS Main
        const [faas] = await connection.query(
            `SELECT * FROM faas WHERE faas_id = ?`,
            [faas_id]
        );

        const [owners] = await connection.query(
            `SELECT * FROM faas_owners WHERE faas_id = ?`,
            [faas_id]
        );

        if (!faas.length)
            return res.status(404).json({ message: 'FAAS not found' });

        const faasData = faas[0];
        const kind = faasData.property_kind; // FIXED

        const data = {
            faas: faasData,
            owners: owners,
            land: null,
            building: null,
            machinery: null
        };

        const details = await get_faas_details(kind, faas_id, connection);
        if(kind === 'Land') data.land = details.land;
        else if(kind === 'Building') data.building = details.building;
        else data.machinery = details.machinery;
        // console.log(data);

        res.json(data);

    } catch (err) {
        console.error('GET FAAS ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch FAAS', error: err.message });
    } finally {
        connection.release();
    }
});

router.get('/:faas_id/owners', async (req, res)=>{
    try {
        const { faas_id } = req.params;
        const [rows] = await pool.query(`
            SELECT *
            FROM faas_owners
            WHERE faas_id = ?
        `, [faas_id]);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


//original transaction
router.post('/create', async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const {
            faas,
            owners,
            property_kind,
            appraisal,
            assessment,
            adjustments,
            improvements,
            additionals,
            general,
            floors,
            materials
        } = req.body;

        if (!faas?.property_id || !faas?.ry_id || !faas?.effectivity_date) {
            return res.status(400).json({ message: 'Missing required FAAS fields.' });
        }

        await connection.beginTransaction();
        const active = await getActive();

        const [existing] = await connection.query(
            `SELECT faas_id FROM faas WHERE property_id=? AND status='ACTIVE' LIMIT 1`,
            [faas.property_id]
        );

        const previous_faas_id = existing.length ? existing[0].faas_id : null;

        await connection.query(
            `UPDATE faas SET status='INACTIVE' WHERE property_id=? AND status='ACTIVE'`,
            [faas.property_id]
        );

        const [faasResult] = await connection.query(
            `INSERT INTO faas (
                property_id, ry_id, faas_no, faas_type,
                effectivity_date, previous_faas_id, status,
                lg_code, barangay, lot_no, block_no, arp_no, pin, taxable, property_kind, created_by
            )
            VALUES (?, ?, '', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                faas.property_id,
                active,
                faas.faas_type || 'ORIGINAL',
                faas.effectivity_date,
                previous_faas_id,
                'ACTIVE',
                faas.lg_code,
                faas.barangay,
                faas.lot_no,
                faas.block_no,
                faas.arp_no,
                faas.pin,
                faas.taxable,
                faas.property_kind,
                faas.created_by || null
            ]
        );
        const newFaasId = faasResult.insertId;
        //for owners
        for(const owner of owners){
            await connection.query(
                `INSERT INTO faas_owners
                (faas_id, owner_id, last_name, first_name, middle_name, suffix,
                tin_no, email, contact_no,
                address_house_no)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    newFaasId,
                    owner.owner_id,
                    owner.last_name,
                    owner.first_name,
                    owner.middle_name,
                    owner.suffix,
                    owner.tin_no,
                    owner.email,
                    owner.contact_no,
                    owner.address_house_no
                ]
            );
        }

        const generatedFaasNo = `FAAS-${String(newFaasId).padStart(5, '0')}`;

        await connection.query(
            `UPDATE faas SET faas_no=? WHERE faas_id=?`,
            [generatedFaasNo, newFaasId]
        );

        if (property_kind === 'Land') {
            if (appraisal) {
                await connection.query(
                    `INSERT INTO faasappraisal (faas_id, classification, subclassification, area, unit_value, base_market_value)
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        newFaasId,
                        appraisal.classification,
                        appraisal.subclassification,
                        appraisal.area,
                        appraisal.unit_value,
                        appraisal.base_market_value
                    ]
                );
            }

            if (assessment) {
                await connection.query(
                    `INSERT INTO faasassessment (faas_id, actual_use, market_value, assessment_level)
                    VALUES (?, ?, ?, ?)`,
                    [
                        newFaasId,
                        assessment.actual_use,
                        assessment.market_value,
                        assessment.assessment_level
                    ]
                );
            }

            if (adjustments?.length) {
                for (const adj of adjustments) {
                    await connection.query(
                        `INSERT INTO faasadjustments (faas_id, factor, adjustment)
                        VALUES (?, ?, ?)`,
                        [newFaasId, adj.factor_name, adj.percent_adjustment]
                    );
                }
            }

            if (improvements?.length) {
                for (const im of improvements) {
                    await connection.query(
                        `INSERT INTO faasimprovements (faas_id, improvement_name, qty, unit_value)
                        VALUES (?, ?, ?, ?)`,
                        [
                            newFaasId,
                            im.improvement_name,
                            im.quantity || 1,
                            im.unit_value || 0
                        ]
                    );
                }
            }
        }

        if (property_kind === 'Building') {
            if (general) {
                await connection.query(
                    `INSERT INTO faasbldggeneral (faas_id, buildingKind, structuralType, buildingAge, storeys)
                    VALUES (?, ?, ?, ?, ?)`,
                    [
                        newFaasId,
                        general.buildingKind,
                        general.structuraltype,
                        general.buildingage,
                        general.storeys
                    ]
                );
            }

            if (floors?.length) {
                for (const f of floors) {
                    await connection.query(
                        `INSERT INTO faasbldgfloorsarea (faas_id, floor_no, floor_area)
                        VALUES (?, ?, ?)`,
                        [
                            newFaasId,
                            f.floor_no,
                            f.floor_area
                        ]
                    );
                }
            }

            if (materials?.length) {
                for (const m of materials) {
                    await connection.query(
                        `INSERT INTO faasbldgstruturalmaterials (faas_id, part, floor_no, material)
                        VALUES (?, ?, ?, ?)`,
                        [
                            newFaasId,
                            m.part,
                            m.floor_no || null,
                            m.material
                        ]
                    );
                }
            }

            if (appraisal) {
                await connection.query(
                    `INSERT INTO faasbldgappraisal 
                    (faas_id, unit_cost, base_market_value, additional_total, additional_market_value,
                     deprication_rate, depreciation_cost, final_market_value)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        newFaasId,
                        appraisal.unit_cost,
                        appraisal.base_market_value,
                        appraisal.additional_total,
                        appraisal.additional_market_value,
                        appraisal.depreciation_rate,
                        appraisal.depreciation_cost,
                        appraisal.final_market_value
                    ]
                );
            }

            if (assessment) {
                await connection.query(
                    `INSERT INTO faasbldgassessment 
                    (faas_id, actual_use, market_value, assessment_level, assessed_value, taxable)
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        newFaasId,
                        assessment.actual_use,
                        assessment.market_value,
                        assessment.assessment_level,
                        assessment.assessed_value,
                        assessment.taxable
                    ]
                );
            }

            if (additionals?.length) {
                for (const a of additionals) {
                    await connection.query(
                        `INSERT INTO faasbldgadditionalitems 
                        (faas_id, item_name, quantity, unit_cost)
                        VALUES (?, ?, ?, ?)`,
                        [
                            newFaasId,
                            a.item_name,
                            a.quantity,
                            a.unit_cost
                        ]
                    );
                }
            }
        }

        if (property_kind === 'Machinery') {
            if (appraisal) {
                await connection.query(
                    `INSERT INTO faasmachineryappraisal 
                    (faas_id, machinery_type, brand_model, capacity_hp, machinery_condition, estimated_life,
                     remaining_life, year_installed, initial_operation, original_cost, conversion_factor, rcn,
                     years_used, depreciation_rate, depreciation_value)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        newFaasId,
                        appraisal.machinery_type,
                        appraisal.brand_model,
                        appraisal.capacity_hp,
                        appraisal.machinery_condition,
                        appraisal.estimated_life,
                        appraisal.remaining_life,
                        appraisal.year_installed,
                        appraisal.initial_operation,
                        appraisal.original_cost,
                        appraisal.conversion_factor,
                        appraisal.rcn,
                        appraisal.year_used,
                        appraisal.depreciation_rate,
                        appraisal.depraciation_value
                    ]
                );
            }

            if (assessment) {
                await connection.query(
                    `INSERT INTO faasmachineryassessment
                    (faas_id, actual_use, market_value, assessment_level, assessed_value, taxable)
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        newFaasId,
                        assessment.actual_use,
                        assessment.market_value,
                        assessment.assessment_level,
                        assessment.assessed_value,
                        assessment.taxable
                    ]
                );
            }
        }

        //history header
        const [historyRes] = await connection.query(
            `INSERT INTO property_history(property_id, action, remarks)
             VALUES (?, 'ORIGINAL', 'Initial property assessment and record creation.')`,
            [faas.property_id]
        );

        await connection.commit();

        res.status(201).json({
            message: 'FAAS created successfully',
            faas_id: newFaasId,
            faas_no: generatedFaasNo,
            previous_faas_id
        });
    }

    catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ message: 'FAAS creation failed', error: err.message });
    }

    finally {
        connection.release();
    }
});

function getNames(owners){
    return owners.map(o => {
        const mi = o.middle_name
            ? o.middle_name.trim().charAt(0).toUpperCase() + '.'
            : '';

        return `${o.last_name}, ${o.first_name} ${mi} ${o.suffix || ''}`.trim();
    });
}

router.post('/transfer', async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { faas_id, new_owner_ids } = req.body;

        if (!faas_id || !Array.isArray(new_owner_ids) || !new_owner_ids.length)
            return res.status(400).json({ message: 'Invalid transfer payload' });

        await connection.beginTransaction();

        /* 1️⃣ GET OLD FAAS */
        const [faasRows] = await connection.query(
            `SELECT * FROM FAAS WHERE faas_id = ? AND status = 'ACTIVE'`,
            [faas_id]
        );

        await connection.query(
            `UPDATE faas SET status='INACTIVE' WHERE property_id=? AND status='ACTIVE'`,
            [faas_id]
        );

        if (!faasRows.length)
            return res.status(404).json({ message: 'FAAS not found or inactive' });


        const oldFaas = faasRows[0];

        /* 2️⃣ GENERATE FAAS NO */


        /* 3️⃣ INSERT NEW FAAS (TRANSFER) */
        const [insert] = await connection.query(
            `INSERT INTO FAAS (
                property_id,
                ry_id,
                faas_no,
                faas_type,
                effectivity_date,
                previous_faas_id,
                property_kind,
                created_by,
                arp_no,
                pin,
                lg_code,
                barangay,
                lot_no,
                block_no, 
                taxable
            ) VALUES (?, ?, '', 'TRANSFER', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                oldFaas.property_id,
                oldFaas.ry_id,
                new Date(),
                oldFaas.faas_id,
                oldFaas.property_kind,
                req.user?.username || "System",
                oldFaas.arp_no,
                oldFaas.pin,
                oldFaas.lg_code,
                oldFaas.barangay,
                oldFaas.lot_no,
                oldFaas.block_no,
                oldFaas.taxable
            ]
        );

        const newFaasId = insert.insertId;
        const faas_no = `FAAS-${String(newFaasId).padStart(5, '0')}`;
        await connection.query(
            `UPDATE faas SET faas_no=? WHERE faas_id=?`,
            [faas_no, newFaasId]
        );

        /* 4️⃣ INSERT NEW OWNERS (SNAPSHOT) */
        for (const o of new_owner_ids) {
            await connection.query(
                `INSERT INTO faas_owners
                (faas_id, last_name, first_name, middle_name, suffix,
                 tin_no, email, address_house_no, owner_id, contact_no)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    newFaasId,
                    o.last_name,
                    o.first_name,
                    o.middle_name || null,
                    o.suffix || null,
                    o.tin_no || null,
                    o.email || null,
                    o.address_house_no || null,
                    o.owner_id,
                    o.contact_no
                ]
            );
        }

        /* 5️⃣ COPY FAAS DETAILS */
        const copy = async (table, cols) => {
            await connection.query(
                `INSERT INTO ${table} (${cols})
                 SELECT ${cols.replace('faas_id', '?')}
                 FROM ${table}
                 WHERE faas_id = ?`,
                [newFaasId, oldFaas.faas_id]
            );
        };

        if (oldFaas.property_kind === 'Land') {
            await copy('faasappraisal', 'faas_id, classification, subclassification, area, unit_value, base_market_value');
            await copy('faasassessment', 'faas_id, actual_use, market_value, assessment_level');
            await copy('faasadjustments', 'faas_id, factor, adjustment');
            await copy('faasimprovements', 'faas_id, improvement_name, qty, unit_value');
        }

        if (oldFaas.property_kind === 'Building') {
            await copy('faasbldggeneral', 'faas_id, buildingkind, structuraltype, buildingage, storeys');
            await copy('faasbldgfloorsarea', 'faas_id, floor_no, floor_area');
            await copy('faasbldgstruturalmaterials', 'faas_id, part, floor_no, material');
            await copy('faasbldgappraisal', 'faas_id, unit_cost, base_market_value, additional_total, deprication_rate, depreciation_cost, final_market_value');
            await copy('faasbldgassessment', 'faas_id, actual_use, market_value, assessment_level, assessed_value, taxable');
            await copy('faasbldgadditionalitems', 'faas_id, item_name, quantity, unit_cost');
        }

        if (oldFaas.property_kind === 'Machinery') {
            await copy('faasmachineryappraisal', 'faas_id, machinery_type, brand_model, capacity_hp, date_acquired, machinery_condition, estimated_life, remaining_life, year_installed, initial_operation, original_cost, conversion_factor, rcn, years_used, depreciation_rate, depreciation_value');
            await copy('faasmachineryassessment', 'faas_id, actual_use, market_value, assessment_level, assessed_value, taxable');
        }

        /* 6️⃣ CANCEL OLD FAAS doubled */
        await connection.query(
            `UPDATE FAAS SET status = 'CANCELLED' WHERE faas_id = ?`,
            [oldFaas.faas_id]
        );

        //history header
        const [historyRes] = await connection.query(
            `INSERT INTO property_history(property_id, action, remarks)
             VALUES (?, 'TRANSFER', 'Property Owners modified.')`,
            [oldFaas.property_id]
        );
        const history_id = historyRes.insertId;

        const [oldOwners] = await connection.query(`SELECT * FROM faas_owners WHERE faas_id = ? `, [oldFaas.faas_id]);
        
        await connection.query(
            `INSERT INTO property_history_columns
                (history_id, column_name, old_value, new_value)
                VALUES (?, ?, ?, ?)`,
            [history_id, 'owners', getNames(oldOwners).join('||'), getNames(new_owner_ids).join('||')]
        );


        await connection.query('DELETE FROM property_owners WHERE property_id = ?', [oldFaas.property_id]);
        
        for(const owner of new_owner_ids){
           await connection.query(`INSERT INTO property_owners(property_id, owner_id) VALUES(?, ?)`, [oldFaas.property_id, owner.owner_id]);
        }
        // const [test] = await connection.query('SELECT * FROM property_owners WHERE property_id = ?', [oldFaas.property_id]);
        // console.log(test);

        await connection.commit();

        res.status(201).json({
            message: 'FAAS transfer completed',
            old_faas_id: faas_id,
            new_faas_id: newFaasId,
            faas_no
        });

    } catch (err) {
        await connection.rollback();
        console.error('TRANSFER ERROR:', err);
        res.status(500).json({ message: 'Transfer failed', error: err.message });
    } finally {
        connection.release();
    }
});

router.post('/cancel', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const {
            faas_id,
            cancellation_reason,
            cancellation_date,
            remarks
        } = req.body;

        if (!faas_id || !cancellation_reason)
            return res.status(400).json({ message: 'Missing required fields.' });

        await conn.beginTransaction();

        // Fetch current FAAS
        const [currentFaas] = await conn.query(
            `SELECT * FROM faas WHERE faas_id = ?`,
            [faas_id]
        );
        if (!currentFaas.length)
            return res.status(404).json({ message: 'FAAS not found.' });

        const faas = currentFaas[0];

        // Check if already cancelled
        if (faas.status === 'CANCELLED')
            return res.status(400).json({ message: 'FAAS is already cancelled.' });

        const propertyId = faas.property_id;
        
        // Update FAAS status to CANCELLED
        await conn.query(
            `UPDATE faas SET status = 'CANCELLED' WHERE faas_id = ?`,
            [faas_id]
        );

        await conn.query(`UPDATE propertymasterlist SET status = 'CANCELLED' WHERE property_id = ?`, [propertyId]);

        const [historyRes] = await conn.query(
            `INSERT INTO property_history(property_id, action, remarks)
             VALUES (?, 'CANCELLED', ?)`,
            [propertyId, remarks]
        );
        const history_id = historyRes.insertId;

        await conn.query(
            `INSERT INTO property_history_columns
                (history_id, column_name, old_value, new_value)
                VALUES (?, ?, ?, ?)`,
            [history_id, 'cancellation_reason', null, cancellation_reason]
        );
        
        await conn.query(
            `INSERT INTO property_history_columns
                (history_id, column_name, old_value, new_value)
                VALUES (?, ?, ?, ?)`,
            [history_id, 'cancellation_date', null, cancellation_date]
        );

        await conn.commit();

        res.json({
            message: 'FAAS cancelled successfully',
            faas_id: faas_id,
            faas_no: faas.faas_no
        });

    } catch (err) {
        await conn.rollback();
        console.log('CANCELLATION ERROR:', err);
        res.status(500).json({ message: 'Cancellation failed', error: err.message });
    } finally {
        conn.release();
    }
});

router.post('/reclassify', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const {
            faas_id,
            reclassification_date,
            // New classification data
            new_classification,
            new_subclassification,
            new_actual_use,
            new_unit_value,
            new_assessment_level,
            remarks
        } = req.body;

        if (!faas_id || !reclassification_date)
            return res.status(400).json({ message: 'Missing required fields.' });

        await conn.beginTransaction();

        // Fetch current FAAS with all related data
        const [currentFaas] = await conn.query(
            `SELECT * FROM faas WHERE faas_id = ?`,
            [faas_id]
        );
        if (!currentFaas.length)
            return res.status(404).json({ message: 'FAAS not found.' });

        const faas = currentFaas[0];
        const propertyId = faas.property_id;
        const propertyKind = faas.property_kind;

        // Validate property kind - only Land and Building can be reclassified
        // if (propertyKind !== 'Land' && propertyKind !== 'Building') {
        //     return res.status(400).json({ 
        //         message: 'Only Land and Building properties can be reclassified.' 
        //     });
        // }

        // Set current FAAS to INACTIVE
        await conn.query(
            `UPDATE faas SET status = 'CANCELLED' WHERE faas_id = ?`,
            [faas_id]
        );

        // Create new FAAS record with REVISION type
        const [newFaas] = await conn.query(
            `INSERT INTO faas
            (property_id, ry_id, faas_no, faas_type, owner_name, owner_address, lg_code, barangay, lot_no, block_no, arp_no, pin, effectivity_date, previous_faas_id, status, taxable, property_kind, created_by)
            VALUES (?, ?, '', 'REVISION', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)`,
            [
                faas.property_id,
                faas.ry_id,
                faas.owner_name,
                faas.owner_address,
                faas.lg_code,
                faas.barangay,
                faas.lot_no,
                faas.block_no,
                faas.arp_no,
                faas.pin,
                reclassification_date,
                faas_id,
                faas.taxable,
                faas.property_kind,
                faas.created_by
            ]
        );

        const newFaasId = newFaas.insertId;
        const newFaasNo = `FAAS-${String(newFaasId).padStart(5, '0')}`;

        await conn.query(
            `UPDATE faas SET faas_no = ? WHERE faas_id = ?`,
            [newFaasNo, newFaasId]
        );

        // Duplicate and update data based on property kind
        if (propertyKind === 'Land') {
            // Get old appraisal data
            const [oldAppraisal] = await conn.query(
                `SELECT * FROM faasappraisal WHERE faas_id = ?`, [faas_id]
            );
            const oldApp = oldAppraisal.length ? oldAppraisal[0] : null;

            // Get old assessment data
            const [oldAssessment] = await conn.query(
                `SELECT * FROM faasassessment WHERE faas_id = ?`, [faas_id]
            );
            const oldAss = oldAssessment.length ? oldAssessment[0] : null;

            // Calculate new values
            const area = oldApp ? parseFloat(oldApp.area) : 0;
            const unitValue = new_unit_value ? parseFloat(new_unit_value) : (oldApp ? parseFloat(oldApp.unit_value) : 0);
            const baseMarketValue = area * unitValue;

            // Copy appraisal with new classification
            await conn.query(
                `INSERT INTO faasappraisal (faas_id, classification, subclassification, area, unit_value, base_market_value)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    newFaasId,
                    new_classification || oldApp?.classification,
                    new_subclassification || oldApp?.subclassification,
                    area,
                    unitValue,
                    baseMarketValue
                ]
            );

            // Calculate adjusted market value from adjustments
            const [adjustments] = await conn.query(
                `SELECT * FROM faasadjustments WHERE faas_id = ?`, [faas_id]
            );
            
            let totalAdjustmentPercent = 0;
            for (const adj of adjustments) {
                totalAdjustmentPercent += parseFloat(adj.adjustment);
                await conn.query(
                    `INSERT INTO faasadjustments (faas_id, factor, adjustment)
                    VALUES (?, ?, ?)`,
                    [newFaasId, adj.factor, adj.adjustment]
                );
            }

            const adjustedMarketValue = baseMarketValue * (1 + totalAdjustmentPercent / 100);

            // Copy improvements
            const [improvements] = await conn.query(
                `SELECT * FROM faasimprovements WHERE faas_id = ?`, [faas_id]
            );
            
            let improvementsTotal = 0;
            for (const imp of improvements) {
                const impValue = parseFloat(imp.qty) * parseFloat(imp.unit_value);
                improvementsTotal += impValue;
                await conn.query(
                    `INSERT INTO faasimprovements (faas_id, improvement_name, qty, unit_value)
                    VALUES (?, ?, ?, ?)`,
                    [newFaasId, imp.improvement_name, imp.qty, imp.unit_value]
                );
            }

            const finalMarketValue = adjustedMarketValue + improvementsTotal;
            const assessmentLevel = new_assessment_level ? parseFloat(new_assessment_level) : (oldAss ? parseFloat(oldAss.assessment_level) : 0);

            // Copy assessment with new actual use and assessment level
            await conn.query(
                `INSERT INTO faasassessment (faas_id, actual_use, market_value, assessment_level)
                VALUES (?, ?, ?, ?)`,
                [
                    newFaasId,
                    new_actual_use || oldAss?.actual_use,
                    finalMarketValue,
                    assessmentLevel
                ]
            );

            // Record transaction history for classification change
            await conn.query(
                `INSERT INTO faas_transactionhistory
                (property_id, transaction_type, changed_field, old_value, new_value, remarks, created_by)
                VALUES (?, 'RECLASSIFY', 'CLASSIFICATION', ?, ?, ?, ?)`,
                [
                    propertyId,
                    JSON.stringify({
                        classification: oldApp?.classification,
                        subclassification: oldApp?.subclassification,
                        unit_value: oldApp?.unit_value,
                        base_market_value: oldApp?.base_market_value
                    }),
                    JSON.stringify({
                        classification: new_classification || oldApp?.classification,
                        subclassification: new_subclassification || oldApp?.subclassification,
                        unit_value: unitValue,
                        base_market_value: baseMarketValue
                    }),
                    remarks,
                    faas.created_by
                ]
            );

            // Record assessment change
            await conn.query(
                `INSERT INTO faas_transactionhistory
                (property_id, transaction_type, changed_field, old_value, new_value, remarks, created_by)
                VALUES (?, 'RECLASSIFY', 'ASSESSMENT', ?, ?, ?, ?)`,
                [
                    propertyId,
                    JSON.stringify({
                        actual_use: oldAss?.actual_use,
                        market_value: oldAss?.market_value,
                        assessment_level: oldAss?.assessment_level
                    }),
                    JSON.stringify({
                        actual_use: new_actual_use || oldAss?.actual_use,
                        market_value: finalMarketValue,
                        assessment_level: assessmentLevel
                    }),
                    remarks,
                    faas.created_by
                ]
            );
        }

        if (propertyKind === 'Building') {
            // Copy general
            const [general] = await conn.query(
                `SELECT * FROM faasbldggeneral WHERE faas_id = ?`, [faas_id]
            );
            if (general.length) {
                const g = general[0];
                await conn.query(
                    `INSERT INTO faasbldggeneral (faas_id, buildingKind, structuralType, buildingAge, storeys)
                    VALUES (?, ?, ?, ?, ?)`,
                    [newFaasId, g.buildingKind, g.structuralType, g.buildingAge, g.storeys]
                );
            }

            // Copy floors
            const [floors] = await conn.query(
                `SELECT * FROM faasbldgfloorsarea WHERE faas_id = ?`, [faas_id]
            );
            for (const f of floors) {
                await conn.query(
                    `INSERT INTO faasbldgfloorsarea (faas_id, floor_no, floor_area)
                    VALUES (?, ?, ?)`,
                    [newFaasId, f.floor_no, f.floor_area]
                );
            }

            // Copy materials
            const [materials] = await conn.query(
                `SELECT * FROM faasbldgstruturalmaterials WHERE faas_id = ?`, [faas_id]
            );
            for (const m of materials) {
                await conn.query(
                    `INSERT INTO faasbldgstruturalmaterials (faas_id, part, floor_no, material)
                    VALUES (?, ?, ?, ?)`,
                    [newFaasId, m.part, m.floor_no, m.material]
                );
            }

            // Copy appraisal
            const [bldgAppraisal] = await conn.query(
                `SELECT * FROM faasbldgappraisal WHERE faas_id = ?`, [faas_id]
            );
            if (bldgAppraisal.length) {
                const ba = bldgAppraisal[0];
                await conn.query(
                    `INSERT INTO faasbldgappraisal 
                    (faas_id, unit_cost, base_market_value, additional_total, additional_market_value,
                     deprication_rate, depreciation_cost, final_market_value)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [newFaasId, ba.unit_cost, ba.base_market_value, ba.additional_total, 
                     ba.additional_market_value, ba.deprication_rate, ba.depreciation_cost, ba.final_market_value]
                );
            }

            // Get old assessment
            const [oldAssessment] = await conn.query(
                `SELECT * FROM faasbldgassessment WHERE faas_id = ?`, [faas_id]
            );
            const oldAss = oldAssessment.length ? oldAssessment[0] : null;

            const assessmentLevel = new_assessment_level ? parseFloat(new_assessment_level) : (oldAss ? parseFloat(oldAss.assessment_level) : 0);
            const marketValue = oldAss ? parseFloat(oldAss.market_value) : 0;
            const assessedValue = marketValue * (assessmentLevel / 100);

            // Copy assessment with new actual use and assessment level
            await conn.query(
                `INSERT INTO faasbldgassessment 
                (faas_id, actual_use, market_value, assessment_level, assessed_value, taxable)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    newFaasId,
                    new_actual_use || oldAss?.actual_use,
                    marketValue,
                    assessmentLevel,
                    assessedValue,
                    oldAss?.taxable || 0
                ]
            );

            // Copy additionals
            const [additionals] = await conn.query(
                `SELECT * FROM faasbldgadditionalitems WHERE faas_id = ?`, [faas_id]
            );
            for (const add of additionals) {
                await conn.query(
                    `INSERT INTO faasbldgadditionalitems 
                    (faas_id, item_name, quantity, unit_cost)
                    VALUES (?, ?, ?, ?)`,
                    [newFaasId, add.item_name, add.quantity, add.unit_cost]
                );
            }

            // Record transaction history
            await conn.query(
                `INSERT INTO faas_transactionhistory
                (property_id, transaction_type, changed_field, old_value, new_value, remarks, created_by)
                VALUES (?, 'RECLASSIFY', 'ASSESSMENT', ?, ?, ?, ?)`,
                [
                    propertyId,
                    JSON.stringify({
                        actual_use: oldAss?.actual_use,
                        market_value: oldAss?.market_value,
                        assessment_level: oldAss?.assessment_level,
                        assessed_value: oldAss?.assessed_value
                    }),
                    JSON.stringify({
                        actual_use: new_actual_use || oldAss?.actual_use,
                        market_value: marketValue,
                        assessment_level: assessmentLevel,
                        assessed_value: assessedValue
                    }),
                    remarks,
                    faas.created_by
                ]
            );
        }

        // if (propertyKind === 'Machinery') {
        //     // Copy Machinery Appraisal
        //     const [machApp] = await conn.query(
        //         `SELECT * FROM faasmachineryappraisal WHERE faas_id = ?`, 
        //         [faas_id]
        //     );

        //     if (machApp.length) {
        //         const ma = machApp[0];

        //         await conn.query(
        //             `INSERT INTO faasmachineryappraisal 
        //             (faas_id, kind, model_no, capacity, date_acquired, condition_acquired, 
        //             acquisition_cost, economic_life, remaining_life, depreciation, 
        //             depreciated_value, market_value)
        //             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        //             [
        //                 newFaasId,
        //                 ma.kind,
        //                 ma.model_no,
        //                 ma.capacity,
        //                 ma.date_acquired,
        //                 ma.condition_acquired,
        //                 ma.acquisition_cost,
        //                 ma.economic_life,
        //                 ma.remaining_life,
        //                 ma.depreciation,
        //                 ma.depreciated_value,
        //                 ma.market_value
        //             ]
        //         );
        //     }

        //     // Copy old assessment
        //     const [machAss] = await conn.query(
        //         `SELECT * FROM faasmachineryassessment WHERE faas_id = ?`, 
        //         [faas_id]
        //     );

        //     const oldAss = machAss.length ? machAss[0] : null;

        //     const assessmentLevel = new_assessment_level 
        //         ? parseFloat(new_assessment_level) 
        //         : (oldAss ? parseFloat(oldAss.assessment_level) : 0);

        //     const marketValue = oldAss ? parseFloat(oldAss.market_value) : 0;
        //     const assessedValue = marketValue * (assessmentLevel / 100);

        //     // Copy Machinery Assessment with new actual use + assessment level
        //     await conn.query(
        //         `INSERT INTO faasmachineryassessment 
        //         (faas_id, actual_use, market_value, assessment_level, assessed_value, taxable)
        //         VALUES (?, ?, ?, ?, ?, ?)`,
        //         [
        //             newFaasId,
        //             new_actual_use || oldAss?.actual_use,
        //             marketValue,
        //             assessmentLevel,
        //             assessedValue,
        //             oldAss?.taxable || 0
        //         ]
        //     );

        //     // Record transaction history
        //     await conn.query(
        //         `INSERT INTO faas_transactionhistory
        //         (property_id, transaction_type, changed_field, old_value, new_value, remarks, created_by)
        //         VALUES (?, 'REVISION', 'ASSESSMENT', ?, ?, ?, ?)`,

        //         [
        //             propertyId,
        //             JSON.stringify({
        //                 actual_use: oldAss?.actual_use,
        //                 market_value: oldAss?.market_value,
        //                 assessment_level: oldAss?.assessment_level,
        //                 assessed_value: oldAss?.assessed_value
        //             }),
        //             JSON.stringify({
        //                 actual_use: new_actual_use || oldAss?.actual_use,
        //                 market_value: marketValue,
        //                 assessment_level: assessmentLevel,
        //                 assessed_value: assessedValue
        //             }),
        //             remarks,
        //             faas.created_by
        //         ]
        //     );
        // }

        await conn.commit();

        res.json({
            message: 'FAAS reclassified successfully',
            faas_id: newFaasId,
            faas_no: newFaasNo,
            previous_faas_id: faas_id
        });

    } catch (err) {
        await conn.rollback();
        console.log('RECLASSIFICATION ERROR:', err);
        res.status(500).json({ message: 'Reclassification failed', error: err.message });
    } finally {
        conn.release();
    }
});

router.post('/destroy', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const {
            faas_id,
            destruction_reason,
            destruction_date,
            remarks
        } = req.body;

        if (!faas_id || !destruction_reason)
            return res.status(400).json({ message: 'Missing required fields.' });

        await conn.beginTransaction();

        // Fetch FAAS
        const [currentFaas] = await conn.query(
            `SELECT * FROM faas WHERE faas_id = ?`,
            [faas_id]
        );

        if (!currentFaas.length)
            return res.status(404).json({ message: 'FAAS not found.' });

        const faas = currentFaas[0];

        if (faas.status === 'CANCELLED')
            return res.status(400).json({ message: 'FAAS is already cancelled.' });

        const propertyId = faas.property_id;
        const propertyKind = faas.property_kind; // LAND / BUILDING / MACHINERY

        // ------------------------------------------
        // GET PROPERTY DETAILS FROM THE CORRECT TABLE
        // ------------------------------------------
        let property = null;

        // if (propertyKind === "LAND") {
        //     const [p] = await conn.query(
        //         `SELECT owner_name, owner_address, property_status 
        //          FROM propertymasterlist WHERE property_id = ?`,
        //         [propertyId]
        //     );
        //     property = p.length ? p[0] : null;
        // }

        if (propertyKind === "BUILDING") {
            const [p] = await conn.query(
                `SELECT owner_name, owner_address, property_status 
                 FROM propertybuilding WHERE property_id = ?`,
                [propertyId]
            );
            property = p.length ? p[0] : null;
        }

        if (propertyKind === "MACHINERY") {
            const [p] = await conn.query(
                `SELECT owner_name, owner_address, property_status 
                 FROM propertymachinery WHERE property_id = ?`,
                [propertyId]
            );
            property = p.length ? p[0] : null;
        }

        // ------------------------------------------
        // CANCEL FAAS
        // ------------------------------------------
        await conn.query(
            `UPDATE faas SET status = 'CANCELLED' WHERE faas_id = ?`,
            [faas_id]
        );

        // ------------------------------------------
        // UPDATE PROPERTY STATUS (DEPENDS ON KIND)
        // ------------------------------------------
        // if (propertyKind === "LAND") {
        //     await conn.query(
        //         `UPDATE propertymasterlist
        //          SET property_status = 'DESTROYED'
        //          WHERE property_id = ?`,
        //         [propertyId]
        //     );
        // }

        if (propertyKind === "BUILDING") {
            await conn.query(
                `UPDATE propertybuilding
                 SET property_status = 'DESTROYED'
                 WHERE property_id = ?`,
                [propertyId]
            );
        }

        if (propertyKind === "MACHINERY") {
            await conn.query(
                `UPDATE propertymachinery
                 SET property_status = 'DESTROYED'
                 WHERE property_id = ?`,
                [propertyId]
            );
        }

        // ------------------------------------------
        // INSERT FAAS HISTORY
        // ------------------------------------------
        await conn.query(
            `INSERT INTO faas_transactionhistory
            (property_id, transaction_type, changed_field, old_value, new_value, remarks, created_by)
            VALUES (?, 'DESTROYED', 'STATUS', ?, ?, ?, ?)`,
            [
                propertyId,
                JSON.stringify({
                    status: 'ACTIVE',
                    property_status: property?.property_status || null
                }),

                JSON.stringify({
                    status: 'CANCELLED',
                    property_status: 'DESTROYED',
                    reason: destruction_reason,
                    destruction_date:
                        destruction_date || new Date().toISOString().split('T')[0]
                }),

                remarks,
                faas.created_by
            ]
        );

        await conn.commit();

        res.json({
            message: 'FAAS destroyed/demolished successfully',
            faas_id,
            faas_no: faas.faas_no
        });

    } catch (err) {
        await conn.rollback();
        console.log('DESTROY ERROR:', err);
        res.status(500).json({ message: 'Destruction failed', error: err.message });
    } finally {
        conn.release();
    }
});

router.post('/improvement', async (req, res) => {
    const conn = await pool.getConnection();
    try {

        const {
            faas_id,
            improvement_items, // [{ improvement_name, qty, unit_value }]
            improvement_date,
            remarks
        } = req.body;

        if (!faas_id || !Array.isArray(improvement_items))
            return res.status(400).json({ message: 'Missing required fields.' });

        await conn.beginTransaction();

        // Get current FAAS
        const [faasRows] = await conn.query(
            `SELECT * FROM faas WHERE faas_id = ?`,
            [faas_id]
        );
        if (!faasRows.length)
            return res.status(404).json({ message: 'FAAS not found.' });

        const faas = faasRows[0];
        const propertyId = faas.property_id;

        // Ensure LAND only
        if (faas.property_kind !== 'Land') {
            return res.status(400).json({
                message: 'Improvements transaction is only applicable to LAND properties.'
            });
        }

        // Cancel old FAAS
        await conn.query(
            `UPDATE faas SET status = 'CANCELLED' WHERE faas_id = ?`,
            [faas_id]
        );

        // Create new FAAS
        const [newFaas] = await conn.query(
            `INSERT INTO faas
            (property_id, ry_id, faas_no, faas_type, owner_name, owner_address, lg_code, barangay, lot_no, block_no, arp_no, pin,
             effectivity_date, previous_faas_id, status, taxable, property_kind, created_by)
            VALUES (?, ?, '', 'IMPROVEMENT', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)`,

            [
                faas.property_id,
                faas.ry_id,
                faas.owner_name,
                faas.owner_address,
                faas.lg_code,
                faas.barangay,
                faas.lot_no,
                faas.block_no,
                faas.arp_no,
                faas.pin,
                improvement_date,
                faas_id,
                faas.taxable,
                faas.property_kind,
                faas.created_by
            ]
        );

        const newFaasId = newFaas.insertId;
        const newFaasNo = `FAAS-${String(newFaasId).padStart(5, '0')}`;

        await conn.query(
            `UPDATE faas SET faas_no = ? WHERE faas_id = ?`,
            [newFaasNo, newFaasId]
        );

        // Duplicate appraisal
        const [appraisal] = await conn.query(
            `SELECT * FROM faasappraisal WHERE faas_id = ?`,
            [faas_id]
        );
        if (appraisal.length) {
            const a = appraisal[0];
            await conn.query(
                `INSERT INTO faasappraisal 
                 (faas_id, classification, subclassification, area, unit_value, base_market_value)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [newFaasId, a.classification, a.subclassification, a.area, a.unit_value, a.base_market_value]
            );
        }

        // Duplicate assessment
        const [assessment] = await conn.query(
            `SELECT * FROM faasassessment WHERE faas_id = ?`,
            [faas_id]
        );
        if (assessment.length) {
            const ass = assessment[0];
            await conn.query(
                `INSERT INTO faasassessment (faas_id, actual_use, market_value, assessment_level)
                 VALUES (?, ?, ?, ?)`,
                [newFaasId, ass.actual_use, ass.market_value, ass.assessment_level]
            );
        }

        // Duplicate adjustments
        const [adjustments] = await conn.query(
            `SELECT * FROM faasadjustments WHERE faas_id = ?`,
            [faas_id]
        );
        for (const adj of adjustments) {
            await conn.query(
                `INSERT INTO faasadjustments (faas_id, factor, adjustment)
                 VALUES (?, ?, ?)`,
                [newFaasId, adj.factor, adj.adjustment]
            );
        }

        // Duplicate PREVIOUS improvements
        const [oldImprovs] = await conn.query(
            `SELECT * FROM faasimprovements WHERE faas_id = ?`,
            [faas_id]
        );
        for (const imp of oldImprovs) {
            await conn.query(
                `INSERT INTO faasimprovements (faas_id, improvement_name, qty, unit_value)
                 VALUES (?, ?, ?, ?)`,
                [newFaasId, imp.improvement_name, imp.qty, imp.unit_value]
            );
        }

        // Insert NEW improvements
        for (const newImp of improvement_items) {
            await conn.query(
                `INSERT INTO faasimprovements (faas_id, improvement_name, qty, unit_value)
                 VALUES (?, ?, ?, ?)`,
                [
                    newFaasId,
                    newImp.improvement_name,
                    newImp.qty,
                    newImp.unit_value
                ]
            );
        }


        //for old improvements
        //check if the latest faas has other improvements, if not, use  this
        let oldImprovsHistory;
        if(oldImprovs.length <= 0){
            const [temp] = await conn.query(
                `
                    SELECT * FROM landotherimprovements 
                    WHERE land_id IN (
                        SELECT land_id 
                        FROM propertyland 
                        WHERE property_id = ?
                    );
                `,
                [faas.property_id]
            );
            oldImprovsHistory = temp;
        }else{
            oldImprovsHistory = oldImprovs;
        }


        // Insert transaction history
        await conn.query(
            `INSERT INTO faas_transactionhistory
            (property_id, transaction_type, changed_field, old_value, new_value, remarks, created_by)
            VALUES (?, 'IMPROVEMENT', 'IMPROVEMENT', ?, ?, ?, ?)`,

            [
                propertyId,
                JSON.stringify({ faas_no: faas.faas_no, improvements: oldImprovsHistory }),
                JSON.stringify({
                    faas_no: newFaasNo,
                    improvements: [...oldImprovsHistory, ...improvement_items]
                }),
                remarks,
                faas.created_by
            ]
        );

        await conn.commit();

        res.json({
            message: 'Improvement FAAS created successfully',
            new_faas_id: newFaasId,
            new_faas_no: newFaasNo,
            previous_faas_id: faas_id
        });

    } catch (err) {
        await conn.rollback();
        console.log("IMPROVEMENT ERROR:", err);
        res.status(500).json({ message: 'Improvement failed', error: err.message });
    } finally {
        conn.release();
    }
});

// //old
// router.post('/subdivision', async (req, res) => {
//     const conn = await pool.getConnection();
//     try {
//         const {
//             faas_id,
//             subdivision_date,
//             remarks,
//             subdivided_lots
//         } = req.body;

//         //before copying the faas, I should copy the property

//         console.log(subdivided_lots)

//         if (!faas_id || !Array.isArray(subdivided_lots) || subdivided_lots.length < 2) {
//             return res.status(400).json({ message: 'Invalid request. At least 2 lots are required.' });
//         }
        
//         await conn.beginTransaction();
//         //fetch old faas
//         const [faasRows] = await conn.query(
//             `SELECT * FROM FAAS WHERE faas_id = ? AND status = 'ACTIVE'`,
//             [faas_id]
//         );
//         const oldFaasId = faas_id;
//         const oldFaas = faasRows[0];
//         //set to inactive
//         await conn.query(
//             `UPDATE faas SET status='INACTIVE' WHERE property_id=? AND status='ACTIVE'`,
//             [oldFaasId]
//         );

//         const [oldProperty] = await conn.query(`SELECT * FROM propertymasterlist WHERE property_id = ?`, [oldFaas.property_id]);
//         const [oldPropertyLand] = await conn.query(`SELECT land_id, property_id, au_code, psc_code, lot_area FROM propertyland WHERE property_id = ?`, [oldFaas.property_id]);
//         const oldPropertyData = oldProperty[0];
//         const oldPropertyLandData = oldPropertyLand[0];
        
//         const [oldPropertyImprovements] = await conn.query(`SELECT * FROM landotherimprovements WHERE land_id = ?`, [oldPropertyLandData.land_id]);
//         const oldPropertyImprovementsData = oldPropertyImprovements;

        

//         const copy = async (table, cols, oldFaasId, keys, vals) => {
//             await conn.query(
//                 `INSERT INTO ${table} (${cols})
//                  SELECT ${keys.reduce((acc, curr)=>acc.replace(curr, '?'), cols)}
//                  FROM ${table}
//                  WHERE faas_id = ?`,
//                 [...vals, oldFaasId]
//             );
//         };

//         const newProperties = [];

//         for(const lot of subdivided_lots){  
//             const [propertyInsert] = await conn.query(`
//                     INSERT INTO propertymasterlist(arp_no, pin, lg_code, barangay, lot_no, block_no, property_kind, description, status)
//                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//                 `,[lot.arp_no, lot.pin, lot.lg_code, lot.barangay, lot.lot_no, lot.block_no, oldPropertyData.property_kind, '', 'ACTIVE'])
//             const newPropertyId = propertyInsert.insertId;
            
//             const [landInsert] = await conn.query(`
//                     INSERT INTO propertyland(property_id, au_code, psc_code, lot_area)
//                     VALUES (?, ?, ?, ?)
//                 `, [newPropertyId, oldPropertyLandData.au_code, oldPropertyLandData.psc_code, lot.area]);
            
//             const newLandId = landInsert.insertId;
//             // console.log(lot.improvements)
             
//             for(const improvement of lot.improvements){
//                 const [res] = await conn.query(`SELECT * FROM faasimprovements WHERE improvement_id = ?`, [improvement])
//                 await conn.query(`
//                     INSERT INTO landotherimprovements(land_id, name, quantity)
//                     VALUES(?, ?, ?)
//                     `, [newLandId, res[0].improvement_name, res[0].quantity])
//             }

//             //property owners
//             for(const o of lot.owner_ids){
//                 await conn.query(`INSERT INTO 
//                         property_owners(property_id, owner_id)
//                     VALUES (?, ?)`, [newPropertyId, o]);
//             }

//             //new faas
//              //faas creation

//             const [insert] = await conn.query(
//                 `INSERT INTO FAAS (
//                     property_id,
//                     ry_id,
//                     faas_no,
//                     faas_type,
//                     effectivity_date,
//                     previous_faas_id,
//                     property_kind,
//                     created_by,
//                     arp_no,
//                     pin,
//                     lg_code,
//                     barangay,
//                     lot_no,
//                     block_no, 
//                     taxable
//                 ) VALUES (?, ?, '', 'SUBDIVISION', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//                 [
//                     newPropertyId,
//                     oldFaas.ry_id,
//                     new Date(),
//                     oldFaas.faas_id,
//                     oldFaas.property_kind,
//                     req.user?.username || "System",
//                     lot.arp_no,
//                     lot.pin,
//                     lot.lg_code,
//                     lot.barangay,
//                     lot.lot_no,
//                     lot.block_no,
//                     oldFaas.taxable
//                 ]
//             );

//             const newFaasId = insert.insertId;
//             const faas_no = `FAAS-${String(newFaasId).padStart(5, '0')}`;

//             newProperties.push(faas_no);

            

//             await conn.query(
//                 `UPDATE faas SET faas_no=? WHERE faas_id=?`,
//                 [faas_no, newFaasId]
//             );

//             for (const o of lot.owner_ids) {
//                 await conn.query(
//                     `
//                     INSERT INTO 
//                         faas_owners (
//                             faas_id, 
//                             last_name, 
//                             first_name, 
//                             middle_name, 
//                             suffix, 
//                             tin_no, 
//                             email, 
//                             address_house_no, 
//                             owner_id, 
//                             contact_no
//                             )
//                     SELECT ?, last_name, first_name, middle_name, suffix, tin_no, email, address_house_no, owner_id, contact_no
//                     FROM faas_owners
//                     WHERE owner_id = ? AND faas_id = ?
//                     `,
//                     [
//                         newFaasId,
//                         o,
//                         oldFaasId
//                     ]
//                 );
//             }

//             //details copy
//             if (oldFaas.property_kind === 'Land') {
                
//                 //before copying the faas, I should copy the property
                

//                 await copy(
//                     'faasappraisal', 
//                     'faas_id, classification, subclassification, area, unit_value, base_market_value', 
//                     oldFaasId, 
//                     ['faas_id', 'area'], 
//                     [newFaasId, lot.area]
//                 );
//                 await copy(
//                     'faasassessment', 
//                     'faas_id, actual_use, market_value, assessment_level',
//                     oldFaasId,
//                     ['faas_id'],
//                     [newFaasId]
//                 );
//                 await copy(
//                     'faasadjustments', 
//                     'faas_id, factor, adjustment',
//                     oldFaasId,
//                     ['faas_id'],
//                     [newFaasId]
//                 );
//                 // this depends if they own it or not
//                 // await copy(
//                 //     'faasimprovements', 
//                 //     'faas_id, improvement_name, qty, unit_value',
//                 //     oldFaasId,
//                 //     ['faas_id'],
//                 //     [newFaasId]
//                 // );
//             }

//             const [historyRes] = await conn.query(
//                 `INSERT INTO property_history(property_id, action, remarks)
//                 VALUES (?, 'SUBDIVIDED RESULT', 'Parent area have been divided.')`,
//                 [newPropertyId]
//             );
//             const history_id = historyRes.insertId;
//             await conn.query(
//                 `INSERT INTO property_history_columns
//                     (history_id, column_name, old_value, new_value)
//                     VALUES (?, ?, ?, ?)`,
//                 [history_id, 'parent_faas', oldFaas.faas_no, faas_no]
//             );
//         }

//         const [historyRes] = await conn.query(
//             `INSERT INTO property_history(property_id, action, remarks)
//              VALUES (?, 'SUBDIVIDED', 'Property area have been divided.')`,
//             [oldFaas.property_id]
//         );
//         const history_id = historyRes.insertId;

        
//         await conn.query(
//             `INSERT INTO property_history_columns
//                 (history_id, column_name, old_value, new_value)
//                 VALUES (?, ?, ?, ?)`,
//             [history_id, 'faas_nos', oldFaas.faas_no, newProperties.join('||')]
//         );

//         await conn.query(
//             `UPDATE faas SET status = 'CANCELLED' WHERE faas_id = ?`,
//             [oldFaasId]
//         );
        
//         // for the propertymasterlist
//         await conn.query(
//             `UPDATE propertymasterlist SET status = 'SUBDIVIDED' WHERE property_id = ?`,
//             [oldPropertyData.property_id]
//         );

//         // await conn.commit();
//         // res.json({ message: 'Subdivision successful', generated_records: newGeneratedIds });
//         res.json({success: 'worked'})
//     } catch (err) {
//         await conn.rollback();
//         console.error("Subdivision Error:", err);
//         res.status(500).json({ message: 'Subdivision failed', error: err.message });
//     } finally {
//         conn.release();
//     }
// });

router.post('/subdivision', async (req, res) => {
    const conn = await pool.getConnection();

    try {
        const { faas_id, subdivision_date, remarks, subdivided_lots } = req.body;

        if (!faas_id || !Array.isArray(subdivided_lots) || subdivided_lots.length < 2) {
            return res.status(400).json({
                message: 'Invalid request. At least 2 lots are required.'
            });
        }

        await conn.beginTransaction();

        // ===== GET OLD FAAS =====
        const [faasRows] = await conn.query(
            `SELECT * FROM FAAS WHERE faas_id = ? AND status = 'ACTIVE'`,
            [faas_id]
        );

        if (!faasRows.length) {
            throw new Error('Active FAAS not found');
        }

        const oldFaas = faasRows[0];
        const oldFaasId = oldFaas.faas_id;

        // ===== DEACTIVATE OLD FAAS =====
        await conn.query(
            `UPDATE faas SET status='CANCELLED' WHERE property_id=? AND status='ACTIVE'`,
            [oldFaas.property_id]
        );

        // ===== GET OLD PROPERTY DATA =====
        const [[oldProperty]] = await conn.query(
            `SELECT * FROM propertymasterlist WHERE property_id = ?`,
            [oldFaas.property_id]
        );

        const [[oldPropertyLand]] = await conn.query(
            `SELECT land_id, property_id, au_code, psc_code, lot_area
             FROM propertyland WHERE property_id = ?`,
            [oldFaas.property_id]
        );

        // ===== HELPER: COPY FAAS TABLE ROWS =====
        const copyFaasTable = async (table, columns, newFaasId, oldFaasId, areaOverride = null) => {
            const columnList = columns.join(', ');

            let selectList = columns.map(col => {
                if (col === 'faas_id') return '?';
                if (col === 'area' && areaOverride !== null) return '?';
                return col;
            }).join(', ');

            const values = [
                newFaasId,
                ...(areaOverride !== null ? [areaOverride] : []),
                oldFaasId
            ];

            await conn.query(
                `INSERT INTO ${table} (${columnList})
                 SELECT ${selectList}
                 FROM ${table}
                 WHERE faas_id = ?`,
                values
            );
        };

        const newFaasNumbers = [];

        // ===== PROCESS EACH LOT =====
        for (const lot of subdivided_lots) {

            const improvements = lot.improvements || [];
            const owners = lot.owner_ids || [];

            // --- CREATE PROPERTY ---
            const [propertyInsert] = await conn.query(
                `INSERT INTO propertymasterlist
                (arp_no, pin, lg_code, barangay, lot_no, block_no, property_kind, description, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    lot.arp_no,
                    lot.pin,
                    lot.lg_code,
                    lot.barangay,
                    lot.lot_no,
                    lot.block_no,
                    oldProperty.property_kind,
                    '',
                    'ACTIVE'
                ]
            );

            const newPropertyId = propertyInsert.insertId;

            // --- CREATE LAND ---
            const [landInsert] = await conn.query(
                `INSERT INTO propertyland(property_id, au_code, psc_code, lot_area)
                 VALUES (?, ?, ?, ?)`,
                [
                    newPropertyId,
                    oldPropertyLand.au_code,
                    oldPropertyLand.psc_code,
                    lot.area
                ]
            );

            const newLandId = landInsert.insertId;

            // --- COPY LAND IMPROVEMENTS ---
            for (const improvementId of improvements) {
                const [[imp]] = await conn.query(
                    `SELECT * FROM faasimprovements WHERE improvement_id = ?`,
                    [improvementId]
                );

                if (!imp) continue;
                console.log(imp)
                await conn.query(
                    `INSERT INTO landotherimprovements(land_id, name, quantity)
                     VALUES (?, ?, ?)`,
                    [newLandId, imp.improvement_name, imp.qty]
                );
            }

            // --- PROPERTY OWNERS ---
            for (const ownerId of owners) {
                await conn.query(
                    `INSERT INTO property_owners(property_id, owner_id)
                     VALUES (?, ?)`,
                    [newPropertyId, ownerId]
                );
            }

            // --- CREATE NEW FAAS ---
            const [faasInsert] = await conn.query(
                `INSERT INTO FAAS (
                    property_id, ry_id, faas_no, faas_type,
                    effectivity_date, previous_faas_id, property_kind,
                    created_by, arp_no, pin, lg_code, barangay,
                    lot_no, block_no, taxable
                )
                VALUES (?, ?, '', 'SUBDIVISION', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    newPropertyId,
                    oldFaas.ry_id,
                    new Date(),
                    oldFaasId,
                    oldFaas.property_kind,
                    req.user?.username || 'System',
                    lot.arp_no,
                    lot.pin,
                    lot.lg_code,
                    lot.barangay,
                    lot.lot_no,
                    lot.block_no,
                    oldFaas.taxable
                ]
            );

            const newFaasId = faasInsert.insertId;
            const faasNo = `FAAS-${String(newFaasId).padStart(5, '0')}`;

            newFaasNumbers.push(faasNo);

            // --- COPY FAAS IMPROVEMENTS ---
            for (const improvementId of improvements) {
                const [[imp]] = await conn.query(
                    `SELECT * FROM faasimprovements WHERE improvement_id = ?`,
                    [improvementId]
                );

                if (!imp) continue;
                console.log(imp)
                await conn.query(
                    `INSERT INTO faasimprovements(faas_id, improvement_name, qty)
                     VALUES (?, ?, ?)`,
                    [newFaasId, imp.improvement_name, imp.qty]
                );
            }

            await conn.query(
                `UPDATE faas SET faas_no=? WHERE faas_id=?`,
                [faasNo, newFaasId]
            );

            // --- COPY FAAS OWNERS ---
            for (const ownerId of owners) {
                await conn.query(
                    `INSERT INTO faas_owners (
                        faas_id, last_name, first_name, middle_name,
                        suffix, tin_no, email, address_house_no,
                        owner_id, contact_no
                    )
                    SELECT ?, last_name, first_name, middle_name,
                           suffix, tin_no, email, address_house_no,
                           owner_id, contact_no
                    FROM faas_owners
                    WHERE owner_id = ? AND faas_id = ?`,
                    [newFaasId, ownerId, oldFaasId]
                );
            }

            // --- COPY FAAS DETAILS ---
            if (oldFaas.property_kind === 'Land') {

                await copyFaasTable(
                    'faasappraisal',
                    ['faas_id','classification','subclassification','area','unit_value','base_market_value'],
                    newFaasId,
                    oldFaasId,
                    lot.area
                );

                await copyFaasTable(
                    'faasassessment',
                    ['faas_id','actual_use','market_value','assessment_level'],
                    newFaasId,
                    oldFaasId
                );

                await copyFaasTable(
                    'faasadjustments',
                    ['faas_id','factor','adjustment'],
                    newFaasId,
                    oldFaasId
                );
            }

            // --- HISTORY (CHILD) ---
            const [histInsert] = await conn.query(
                `INSERT INTO property_history(property_id, action, remarks)
                 VALUES (?, 'SUBDIVIDED RESULT', 'Parent area have been divided.')`,
                [newPropertyId]
            );

            await conn.query(
                `INSERT INTO property_history_columns
                 (history_id, column_name, old_value, new_value)
                 VALUES (?, ?, ?, ?)`,
                [histInsert.insertId, 'parent_faas', oldFaas.faas_no, faasNo]
            );
        }

        // ===== PARENT HISTORY =====
        const [parentHist] = await conn.query(
            `INSERT INTO property_history(property_id, action, remarks)
             VALUES (?, 'SUBDIVIDED', 'Property area have been divided.')`,
            [oldFaas.property_id]
        );

        await conn.query(
            `INSERT INTO property_history_columns
             (history_id, column_name, old_value, new_value)
             VALUES (?, ?, ?, ?)`,
            [parentHist.insertId, 'faas_nos', oldFaas.faas_no, newFaasNumbers.join('||')]
        );

        // ===== FINAL STATUS UPDATES =====
        await conn.query(
            `UPDATE faas SET status = 'CANCELLED' WHERE faas_id = ?`,
            [oldFaasId]
        );

        await conn.query(
            `UPDATE propertymasterlist SET status = 'SUBDIVIDED' WHERE property_id = ?`,
            [oldProperty.property_id]
        );

        await conn.commit();

        res.json({
            success: true,
            generated_faas: newFaasNumbers
        });

    } catch (err) {
        await conn.rollback();
        console.error('Subdivision Error:', err);

        res.status(500).json({
            message: 'Subdivision failed',
            error: err.message
        });
    } finally {
        conn.release();
    }
});


router.post('/consolidation', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const {
            faas_ids,
            consolidation_date,
            remarks,
            new_arp_no,
            new_pin,
            new_lot_no,
            new_block_no,
            new_barangay,
            owner_name,
            owner_address
        } = req.body;

        if (!Array.isArray(faas_ids) || faas_ids.length < 2) {
            return res.status(400).json({ message: 'At least 2 FAAS IDs required for consolidation.' });
        }

        await conn.beginTransaction();

        // 1. Fetch parent FAAS + validate
        const [faasRows] = await conn.query(
            `SELECT * FROM faas WHERE faas_id IN (?)`,
            [faas_ids]
        );
        if (faasRows.length !== faas_ids.length) {
            return res.status(404).json({ message: 'One or more FAAS not found.' });
        }
        for (const f of faasRows) {
            if (f.property_kind !== 'Land' || f.status !== 'ACTIVE') {
                return res.status(400).json({ message: `FAAS ${f.faas_id} is not active land.` });
            }
        }

        // 2. Cancel parent FAAS + mark properties consolidated
        for (const f of faasRows) {
            await conn.query(`UPDATE faas SET status = 'CANCELLED' WHERE faas_id = ?`, [f.faas_id]);
            await conn.query(`UPDATE PropertyMasterList SET status = 'CONSOLIDATED' WHERE property_id = ?`, [f.property_id]);
        }

        // 3. Aggregate appraisal + assessment + improvements
        let totalArea = 0, totalBMV = 0, totalMV = 0;
        const improvementsToCopy = [];
        let parentAssess = null;

        for (const f of faasRows) {
            const [appRows] = await conn.query(`SELECT * FROM faasappraisal WHERE faas_id = ?`, [f.faas_id]);
            if (appRows.length) {
                totalArea += parseFloat(appRows[0].area);
                totalBMV += parseFloat(appRows[0].base_market_value);
            }

            const [assRows] = await conn.query(`SELECT * FROM faasassessment WHERE faas_id = ?`, [f.faas_id]);
            if (assRows.length) {
                totalMV += parseFloat(assRows[0].market_value);
                parentAssess = assRows[0]; // use one as template
            }

            const [impRows] = await conn.query(`SELECT * FROM faasimprovements WHERE faas_id = ?`, [f.faas_id]);
            improvementsToCopy.push(...impRows);
        }

        // 4. Create new PropertyMasterList
        const [newPropRes] = await conn.query(
            `INSERT INTO PropertyMasterList 
            (arp_no, pin, owner_name, owner_address, barangay, lot_no, block_no, lg_code, property_kind, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Land', 'ACTIVE')`,
            [
                new_arp_no, new_pin, owner_name, owner_address,
                new_barangay, new_lot_no, new_block_no,
                faasRows[0].lg_code
            ]
        );
        const newPropId = newPropRes.insertId;

        // 5. Create new PropertyLand
        const [newLandRes] = await conn.query(
            `INSERT INTO PropertyLand (property_id, au_code, psc_code, lot_area, remarks)
             VALUES (?, ?, ?, ?, ?)`,
            [newPropId, 'AU-CONS', 'PSC-CONS', totalArea, remarks]
        );
        const newLandId = newLandRes.insertId;

        // 6. Create new FAAS
        const [newFaasRes] = await conn.query(
            `INSERT INTO faas
            (property_id, ry_id, faas_no, faas_type, owner_name, owner_address, lg_code, arp_no, pin, barangay, lot_no, block_no, effectivity_date, status, property_kind, created_by)
            VALUES (?, ?, '', 'CONSOLIDATION', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 'Land', ?)`,
            [
                newPropId,
                faasRows[0].ry_id,
                owner_name, owner_address,
                faasRows[0].lg_code,
                new_arp_no,
                new_pin,
                new_barangay,
                new_lot_no,
                new_block_no,
                consolidation_date,
                faasRows[0].created_by
            ]
        );
        const newFaasId = newFaasRes.insertId;
        const newFaasNo = `FAAS-${String(newFaasId).padStart(5, '0')}`;
        await conn.query(`UPDATE faas SET faas_no = ? WHERE faas_id = ?`, [newFaasNo, newFaasId]);

        // 7. Insert appraisal + assessment
        await conn.query(
            `INSERT INTO faasappraisal (faas_id, classification, subclassification, area, unit_value, base_market_value)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [newFaasId, 'CONSOLIDATED', 'CONSOLIDATED', totalArea, totalBMV / totalArea, totalBMV]
        );

        await conn.query(
            `INSERT INTO faasassessment (faas_id, actual_use, market_value, assessment_level)
             VALUES (?, ?, ?, ?)`,
            [newFaasId, parentAssess.actual_use, totalMV, parentAssess.assessment_level]
        );

        // 8. Copy improvements into FAASImprovements + LandOtherImprovements
        for (const imp of improvementsToCopy) {
            await conn.query(
                `INSERT INTO faasimprovements (faas_id, improvement_name, qty, unit_value)
                 VALUES (?, ?, ?, ?)`,
                [newFaasId, imp.improvement_name, imp.qty, imp.unit_value]
            );
            await conn.query(
                `INSERT INTO LandOtherImprovements (land_id, improvement_name, quantity, unit_value, remarks)
                 VALUES (?, ?, ?, ?, ?)`,
                [newLandId, imp.improvement_name, imp.qty, imp.unit_value, imp.remarks]
            );
        }

        // 9. History
        for (const f of faasRows) {
            await conn.query(
                `INSERT INTO faas_transactionhistory
                (property_id, transaction_type, changed_field, old_value, new_value, remarks, created_by)
                VALUES (?, 'CONSOLIDATION_SOURCE', 'STATUS', ?, ?, ?, ?)`,
                [
                    f.property_id,
                    JSON.stringify({ status: 'ACTIVE' }),
                    JSON.stringify({ status: 'CONSOLIDATED', consolidated_into: newPropId }),
                    remarks,
                    f.created_by
                ]
            );
        }

        await conn.query(
            `INSERT INTO faas_transactionhistory
            (property_id, transaction_type, changed_field, old_value, new_value, remarks, created_by)
            VALUES (?, 'CONSOLIDATION_RESULT', 'STATUS', ?, ?, ?, ?)`,
            [
                newPropId,
                JSON.stringify({ consolidated_from: faas_ids }),
                JSON.stringify({ status: 'ACTIVE', faas_id: newFaasId, faas_no: newFaasNo }),
                remarks,
                faasRows[0].created_by
            ]
        );

        await conn.commit();
        res.json({
            message: 'Consolidation successful',
            new_property_id: newPropId,
            new_land_id: newLandId,
            new_faas_id: newFaasId,
            new_faas_no: newFaasNo
        });

    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ message: 'Consolidation failed', error: err.message });
    } finally {
        conn.release();
    }
});

router.post('/revision', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const {
        faas_id,
        revision_date,
        remarks,
        master_data,
        faas_core,
        specific_data,
        improvements,
        adjustments,
        calculations
        } = req.body;

        if (!faas_id || !revision_date) {
        return res.status(400).json({ message: 'Missing required fields.' });
        }

        await conn.beginTransaction();

        // 1. Fetch current FAAS
        const [faasRows] = await conn.query(`SELECT * FROM faas WHERE faas_id = ?`, [faas_id]);
        if (!faasRows.length) return res.status(404).json({ message: 'FAAS not found.' });
        const oldFaas = faasRows[0];

        // 2. Cancel old FAAS
        await conn.query(`UPDATE faas SET status = 'CANCELLED' WHERE faas_id = ?`, [faas_id]);

        // 3. Create new FAAS
        const [newFaasRes] = await conn.query(
        `INSERT INTO faas
        (property_id, ry_id, faas_no, arp_no, pin, faas_type, owner_name, owner_address, lg_code, barangay, lot_no, block_no,
            effectivity_date, previous_faas_id, status, taxable, property_kind, created_by)
        VALUES (?, ?, '', ?, ?, 'REVISION', ?, ?, ? ,? ,? , ?, ?, ?, 'ACTIVE', ?, ?, ?)`,
        [
            oldFaas.property_id,
            faas_core.ry_id,
            master_data.arp_no,
            master_data.pin,
            master_data.owner_name,
            master_data.owner_address,
            master_data.lg_code,
            master_data.barangay,
            master_data.lot_no,
            master_data.block_no,
            revision_date,
            faas_id,
            faas_core.taxable,
            master_data.property_kind,
            oldFaas.created_by
        ]
        );
        const newFaasId = newFaasRes.insertId;
        const newFaasNo = `FAAS-${String(newFaasId).padStart(5, '0')}`;
        await conn.query(`UPDATE faas SET faas_no = ? WHERE faas_id = ?`, [newFaasNo, newFaasId]);

        // 4. Insert specific data based on property kind
        if (master_data.property_kind === 'Land') {
        await conn.query(
            `INSERT INTO faasappraisal (faas_id, classification, subclassification, area, unit_value, base_market_value)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [newFaasId, specific_data.pc_code, specific_data.psc_code, faas_core.area, faas_core.unit_value, calculations.base_market_value]
        );

        await conn.query(
            `INSERT INTO faasassessment (faas_id, actual_use, market_value, assessment_level)
            VALUES (?, ?, ?, ?)`,
            [newFaasId, specific_data.au_code, calculations.final_market_value, calculations.assessment_level]
        );

        for (const adj of adjustments) {
            await conn.query(
            `INSERT INTO faasadjustments (faas_id, factor, adjustment)
            VALUES (?, ?, ?)`,
            [newFaasId, adj.factor_name, adj.percent_adjustment]
            );
        }

        for (const imp of improvements) {
            await conn.query(
            `INSERT INTO faasimprovements (faas_id, improvement_name, qty, unit_value)
            VALUES (?, ?, ?, ?)`,
            [newFaasId, imp.improvement_name, imp.quantity, imp.unit_value]
            );
        }
        }

        if (master_data.property_kind === 'Building') {
        await conn.query(
            `INSERT INTO faasbldggeneral (faas_id, buildingKind, structuralType, buildingAge, storeys)
            VALUES (?, ?, ?, ?, ?)`,
            [newFaasId, specific_data.bk_id, specific_data.st_id, specific_data.year_constructed, specific_data.no_of_storeys]
        );

        for (const f of specific_data.floor_areas) {
            await conn.query(
            `INSERT INTO faasbldgfloorsarea (faas_id, floor_no, floor_area)
            VALUES (?, ?, ?)`,
            [newFaasId, f.floor_no, f.floor_area]
            );
        }

        for (const m of specific_data.structural_materials) {
            await conn.query(
            `INSERT INTO faasbldgstruturalmaterials (faas_id, part, floor_no, material)
            VALUES (?, ?, ?, ?)`,
            [newFaasId, m.part, m.floor_no, m.material]
            );
        }

        for (const a of specific_data.additional_items) {
            await conn.query(
            `INSERT INTO faasbldgadditionalitems (faas_id, item_name, quantity, unit_cost)
            VALUES (?, ?, ?, ?)`,
            [newFaasId, a.item_name, a.quantity, a.unit_cost]
            );
        }

        await conn.query(
            `INSERT INTO faasbldgappraisal (faas_id, unit_cost, base_market_value, deprication_rate, final_market_value)
            VALUES (?, ?, ?, ?, ?)`,
            [newFaasId, faas_core.unit_value, calculations.base_market_value, faas_core.depreciation_rate, calculations.final_market_value]
        );

        await conn.query(
            `INSERT INTO faasbldgassessment (faas_id, actual_use, market_value, assessment_level, assessed_value, taxable)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [newFaasId, specific_data.bau_id, calculations.final_market_value, calculations.assessment_level, calculations.assessed_value, faas_core.taxable]
        );
        }

        if (master_data.property_kind === 'Machinery') {
        await conn.query(
            `INSERT INTO faasmachineryappraisal
            (faas_id, machinery_type, brand_model, capacity_hp, date_acquired, machinery_condition,
            estimated_life, remaining_life, year_installed, initial_operation, original_cost,
            conversion_factor, rcn, years_used, depreciation_rate, depreciation_value)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
            newFaasId,
            specific_data.mt_id,
            specific_data.brand_model,
            specific_data.capacity_hp,
            specific_data.date_acquired,
            specific_data.condition,
            specific_data.economic_life,
            specific_data.remaining_life,
            specific_data.year_installed,
            specific_data.year_initial_operation,
            specific_data.original_cost,
            specific_data.conversion_factor,
            specific_data.rcn,
            specific_data.years_used,
            specific_data.depreciation_rate,
            specific_data.total_depreciation_value
            ]
        );

        await conn.query(
            `INSERT INTO faasmachineryassessment
            (faas_id, actual_use, market_value, assessment_level, assessed_value, taxable)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [newFaasId, specific_data.mau_id, calculations.final_market_value, calculations.assessment_level, calculations.assessed_value, faas_core.taxable]
        );
        }

        // 5. History
        await conn.query(
        `INSERT INTO faas_transactionhistory
        (property_id, transaction_type, changed_field, old_value, new_value, remarks, created_by)
        VALUES (?, 'REVISION', 'FAAS', ?, ?, ?, ?)`,
        [
            oldFaas.property_id,
            JSON.stringify({ faas_no: oldFaas.faas_no }),
            JSON.stringify({ faas_no: newFaasNo }),
            remarks,
            oldFaas.created_by
        ]
        );

        await conn.commit();
        res.json({
        message: 'FAAS revision successful',
        faas_id: newFaasId,
        faas_no: newFaasNo,
        previous_faas_id: faas_id
        });

    } catch (err) {
        await conn.rollback();
        console.error('REVISION ERROR:', err);
        res.status(500).json({ message: 'Revision failed', error: err.message });
    } finally {
        conn.release();
    }
});



router.get('/history/:property_id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { property_id } = req.params;

        const [rows] = await conn.query(
            `SELECT 
                history_id,
                property_id,
                transaction_type,
                transfer_type,
                changed_field,
                old_value,
                new_value,
                remarks,
                created_by,
                created_date
             FROM faas_transactionhistory
             WHERE property_id = ?
             ORDER BY created_date DESC`,
            [property_id]
        );

        res.json({
            property_id,
            count: rows.length,
            history: rows
        });

    } catch (err) {
        console.error('FAAS HISTORY ERROR:', err);
        res.status(500).json({ message: 'Failed to fetch history', error: err.message });
    } finally {
        conn.release();
    }
});




// router.get("/:faas_id", async (req, res) => {
//     try {
//         const { faas_id } = req.params;

//         // ---------------------------------------
//         // 1. Fetch Base FAAS
//         // ---------------------------------------
//         const [faasRows] = await pool.query(
//             `SELECT * FROM FAAS WHERE faas_id = ?`,
//             [faas_id]
//         );

//         if (faasRows.length === 0) {
//             return res.status(404).json({ message: "FAAS not found." });
//         }

//         const faas = faasRows[0];
//         const kind = faas.property_kind;
//         console.log(faas);

//         // ---------------------------------------
//         // 2. Prepare response object
//         // ---------------------------------------
//         const response = {
//             faas,
//             land: null,
//             building: null,
//             machinery: null
//         };

//         // ---------------------------------------
//         // 3. LAND
//         // ---------------------------------------
//         if (kind === "Land") {
//             const [appraisal] = await pool.query(
//                 `SELECT * FROM FAASAppraisal WHERE faas_id = ?`,
//                 [faas_id]
//             );
//             const [improvements] = await pool.query(
//                 `SELECT * FROM FAASImprovements WHERE faas_id = ?`,
//                 [faas_id]
//             );
//             const [adjustments] = await pool.query(
//                 `SELECT * FROM FAASAdjustments WHERE faas_id = ?`,
//                 [faas_id]
//             );
//             const [assessment] = await pool.query(
//                 `SELECT * FROM FAASAssessment WHERE faas_id = ?`,
//                 [faas_id]
//             );

//             response.land = {
//                 appraisal: appraisal[0] || null,
//                 improvements,
//                 adjustments,
//                 assessment: assessment[0] || null
//             };
//         }

//         // ---------------------------------------
//         // 4. BUILDING
//         // ---------------------------------------
//         if (kind === "Building") {
//             const [general] = await pool.query(
//                 `SELECT * FROM FAASBldgGeneral WHERE faas_id = ?`,
//                 [faas_id]
//             );
//             const [floors_area] = await pool.query(
//                 `SELECT * FROM FAASBldgFloorsArea WHERE faas_id = ?`,
//                 [faas_id]
//             );
//             const [structural] = await pool.query(
//                 `SELECT * FROM FAASBldgStruturalMaterials WHERE faas_id = ?`,
//                 [faas_id]
//             );
//             const [additional] = await pool.query(
//                 `SELECT * FROM FAASBldgAdditionalItems WHERE faas_id = ?`,
//                 [faas_id]
//             );
//             const [appraisal] = await pool.query(
//                 `SELECT * FROM FAASBldgAppraisal WHERE faas_id = ?`,
//                 [faas_id]
//             );
//             const [assessment] = await pool.query(
//                 `SELECT * FROM FAASBldgAssessment WHERE faas_id = ?`,
//                 [faas_id]
//             );

//             response.building = {
//                 general: general[0] || null,
//                 floors_area,
//                 structural_materials: structural,
//                 additional_items: additional,
//                 appraisal: appraisal[0] || null,
//                 assessment: assessment[0] || null
//             };
//         }

//         // ---------------------------------------
//         // 5. MACHINERY
//         // ---------------------------------------
//         if (kind === "Machinery") {
//             const [appraisal] = await pool.query(
//                 `SELECT * FROM FAASMachineryAppraisal WHERE faas_id = ?`,
//                 [faas_id]
//             );
//             const [assessment] = await pool.query(
//                 `SELECT * FROM FAASMachineryAssessment WHERE faas_id = ?`,
//                 [faas_id]
//             );

//             response.machinery = {
//                 appraisal: appraisal[0] || null,
//                 assessment: assessment[0] || null
//             };
//         }

//         // ---------------------------------------
//         // 6. Return full result
//         // ---------------------------------------
//         // res.json(response);

//     } catch (err) {
//         console.error("Error fetching FAAS details:", err);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// });





export default router;
