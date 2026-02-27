import express from "express";
import pool from "../db.js";
import { getActive } from "./global.js";
const router = express.Router();

router.get('/list', async (req, res) => {
    try {
        const [rows] = await pool.query(`
        SELECT 
            pm.*,
            (SELECT f.faas_id FROM faas f WHERE property_id = pm.property_id AND f.faas_type = 'ORIGINAL' LIMIT 1) AS original,
            (SELECT f.faas_no FROM faas f WHERE property_id = pm.property_id AND f.status = 'ACTIVE' LIMIT 1) AS active_faas
        FROM PropertyMasterList pm 
        ORDER BY property_id DESC
        `);
        res.json({success: true, message: "List fetch successfully", data: rows});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/count', async (req, res)=>{
    try{
        const sql = "SELECT COUNT(*) AS total FROM propertymasterlist";
        const [total] = await pool.query(sql, []);
        res.json({success: true, message: "Returned Total Count", data: total[0]});
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});


router.get('/get', async (req, res) => {
    try {
        const { property_id } = req.query;
        if (!property_id)
            return res.status(400).json({ message: "property_id is required" });
        const active = await getActive();
        const [main] = await pool.query(`
            SELECT 
                pml.*,
                lg.lg_id,
                b.barangay_id
            FROM PropertyMasterList pml
            LEFT JOIN locationalgroup lg ON lg.code = pml.lg_code AND lg.ry_id = ?
            LEFT JOIN barangay b ON b.barangay_name = pml.barangay AND b.lg_id = lg.lg_id
            WHERE property_id = ?
        `, [active, property_id]);

        if (main.length === 0)
            return res.status(404).json({ message: "Property not found" });

        const property = main[0];
        const type = property.property_kind;
        let detailQuery;

        if (type === 'Machinery') {
            detailQuery = ` SELECT 
                                pm.*,
                                mt.name,
                                mt.code,
                                pc.pc_id,
                                pc.classname,
                                mal.assessment_level,
                                smv.base_value,
                                smv.depreciation_rate AS smv_depreciation_rate
                            FROM PropertyMachinery pm 
                            LEFT JOIN machinerytype mt ON mt.mt_id = pm.mt_id
                            LEFT JOIN smv_machinery smv ON smv.mt_id = pm.mt_id AND smv.ry_id = ?
                            LEFT JOIN propertyclassification pc ON pc.code = pm.pc_code
                            LEFT JOIN machineryassessmentlevel mal ON mal.pc_id = pc.pc_id AND mal.ry_id = ?
                            WHERE property_id = ?`;
        } else if (type === 'Building') {
            detailQuery = ` -- ?
                            SELECT 
                                pb.*,
                                bk.name,
                                bk.code,
                                pc.pc_id,
                                pc.classname,
                                bau.use_name,
                                bau.assessment_level
                            FROM PropertyBuilding pb
                            LEFT JOIN buildingkind bk ON bk.bk_id = pb.bk_id
                            LEFT JOIN propertyclassification pc ON pc.code = pb.pc_code
                            LEFT JOIN buildingactualuse bau ON bau.use_code = pb.au_code AND bau.ry_id = ?
                            WHERE property_id = ?`;
        } else if (type === 'Land') {
            detailQuery = `
                SELECT 
                    pl.*,
                    au.use_name AS au_name,
                    au.assessment_level,
                    au.taxable,
                    psc.psc_id AS psc_id,
                    psc.subclass_name AS psc_name,
                    pc.pc_id,
                    pc.classname AS pc_name,
                    pc.code AS pc_code
                FROM PropertyLand pl
                LEFT JOIN actualuse au ON au.code = pl.au_code AND au.ry_id = ?
                LEFT JOIN propertysubclassification psc ON psc.code = pl.psc_code AND psc.ry_id = ?
                LEFT JOIN propertyclassification pc ON pc.pc_id = psc.pc_id 
                WHERE property_id = ?
            `;
        } else {
            return res.status(400).json({ message: "Invalid property type" });
        }

        const [det] = await pool.query(detailQuery, [active, active, property_id]);

        const land_id = det[0].land_id;
        const [imp] = await pool.query(`
                SELECT 
                    *
                FROM landotherimprovements
                WHERE land_id = ?
            `, [land_id])

        res.json({
            success: true,
            main: property,
            det: det[0],
            imp: imp
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/update/:id', async (req, res) => {
    const property_id = req.params.id;
    const {
        arp_no, pin,
        lg_code, barangay, lot_no, block_no, property_kind,
        description, status,
        details,
        improvements,
        changed_by //who made the change
    } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1️⃣ Fetch current record (for history)
        const [currentRows] = await connection.query(
            `SELECT * FROM PropertyMasterList WHERE property_id = ?`,
            [property_id]
        );
        if (currentRows.length === 0)
            return res.status(404).json({ error: 'Property not found' });

        const currentData = currentRows[0];

        // 2️⃣ Fetch detail based on kind for snapshot
        let [detailRows] = [ [] ];
        if (currentData.property_kind === 'Land') {
            [detailRows] = await connection.query(
                `SELECT * FROM PropertyLand WHERE property_id = ?`, [property_id]
            );
        } else if (currentData.property_kind === 'Building') {
            [detailRows] = await connection.query(
                `SELECT * FROM PropertyBuilding WHERE property_id = ?`, [property_id]
            );
        } else if (currentData.property_kind === 'Machinery') {
            const active = await getActive();
            [detailRows] = await connection.query(
                `   SELECT * FROM PropertyMachinery pm 
                    LEFT JOIN smv_machinery smv ON smv.mt_id = pm.mt_id AND smv.ry_id = ?
                    WHERE property_id = ?
                `, [active, property_id]
            );
        }

        const snapshot = JSON.stringify({
            master: currentData,
            detail: detailRows[0] || null
        });

        // 3️⃣ Insert into history
        await connection.query(`
            INSERT INTO PropertyMasterList_History
            (property_id, arp_no, pin, owner_id, owner_name, owner_address,
             barangay, lot_no, block_no, lg_code, property_kind, description,
             status, change_reason, snapshot, changed_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'UPDATE', ?, ?)
        `, [
            property_id, currentData.arp_no, currentData.pin, currentData.owner_id,
            currentData.owner_name, currentData.owner_address,
            currentData.barangay, currentData.lot_no, currentData.block_no,
            currentData.lg_code, currentData.property_kind, currentData.description,
            currentData.status, snapshot, changed_by || 'system'
        ]);

        // 4️⃣ Update main PropertyMasterList
        await connection.query(`
            UPDATE PropertyMasterList
            SET arp_no = ?, pin = ?, owner_name = ?, owner_address = ?, owner_id = ?,
                lg_code = ?, barangay = ?, lot_no = ?, block_no = ?, property_kind = ?,
                description = ?, status = ?, updated_date = NOW()
            WHERE property_id = ?
        `, [
            arp_no, pin, owner_name, owner_address, owner_id,
            lg_code, barangay, lot_no, block_no, property_kind,
            description, status, property_id
        ]);

        // 5️⃣ Update corresponding property detail
        if (property_kind === 'Land') {
            const { 
                au_code, psc_code, lot_area, shape, topography, 
                corner_lot, road_access, additional_adj_factor, remarks 
            } = details;

            await connection.query(`
                UPDATE PropertyLand
                SET au_code = ?, psc_code = ?, lot_area = ?, shape = ?, topography = ?,
                    corner_lot = ?, road_access = ?, additional_adj_factor = ?, remarks = ?
                WHERE property_id = ?
            `, [
                au_code, psc_code, lot_area, shape, topography,
                corner_lot, road_access, additional_adj_factor, remarks || null, property_id
            ]);

            //updating improvements
            //get land_id
            const [landIdRows] = await connection.query(
                'SELECT land_id FROM PropertyLand WHERE property_id = ?', 
                [property_id]
            );
            const land_id = landIdRows[0].land_id;
            //insert all to history
            //remove all from the improvements table
            await connection.query(`
                DELETE FROM landotherimprovements WHERE land_id = ?
                `, [land_id])
            //insert new one
            for (const item of improvements) {
                console.log(item)
                const sql = 'INSERT INTO landotherimprovements(land_id, improvement_name, quantity, unit_value) VALUES(?, ?, ?, ?)';
                await connection.query(sql, [land_id, item.improvement_name, item.quantity, item.unit_value]);   
            }

        } else if (property_kind === 'Building') {
            const { 
                bk_id, pc_code, floor_area, no_of_storeys, year_constructed, 
                depreciation_rate, additional_adj_factor, remarks 
            } = details;

            await connection.query(`
                UPDATE PropertyBuilding
                SET bk_id = ?, pc_code = ?, floor_area = ?, no_of_storeys = ?, year_constructed = ?,
                    depreciation_rate = ?, additional_adj_factor = ?, remarks = ?
                WHERE property_id = ?
            `, [
                bk_id, pc_code, floor_area, no_of_storeys, year_constructed || null,
                depreciation_rate, additional_adj_factor, remarks || null, property_id
            ]);

        } else if (property_kind === 'Machinery') {
            const { 
                mt_id, pc_code, machine_description, year_acquired, acquisition_cost = 0,
                estimated_life, depreciation_rate, operational_condition, remarks 
            } = details;
            await connection.query(`
                UPDATE PropertyMachinery
                SET mt_id = ?, pc_code = ?, machine_description = ?, year_acquired = ?, acquisition_cost = ?,
                    estimated_life = ?, depreciation_rate = ?, operational_condition = ?, remarks = ?
                WHERE property_id = ?
            `, [
                mt_id, pc_code, machine_description, year_acquired || null, acquisition_cost,
                estimated_life, depreciation_rate, operational_condition, remarks || null, property_id
            ]);
        }

        await connection.commit();
        connection.release();

        res.status(200).json({ message: 'Property updated and logged successfully', property_id });

    } catch (err) {
        await connection.rollback();
        connection.release();
        console.error('Error updating property:', err);
        res.status(500).json({ 
            error: 'Failed to update property. Transaction rolled back.',
            details: err.message
        });
    }
});



router.post('/add', async (req, res) => {

    // Destructure main PropertyMasterList fields
    const {
        arp_no, pin,
        lg_code, barangay, lot_no, block_no, property_kind,
        description, status,
        details, improvements, owners
    } = req.body;

    // A pool connection is typically required for transactions
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Insert into PropertyMasterList
        const [masterResult] = await connection.query(`
            INSERT INTO PropertyMasterList (
                arp_no, pin, 
                lg_code, barangay, lot_no, block_no, property_kind,
                description, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            arp_no, pin,
            lg_code, barangay, lot_no, block_no, property_kind,
            description, status
        ]);

        const property_id = masterResult.insertId;

        const transformed = owners.map(owner=>[property_id, owner]); 
        const ownerInserSQL = `
            INSERT INTO property_owners
            (property_id, owner_id)
            VALUES ?
        `;
        await connection.query(ownerInserSQL, [transformed]);

        // 2. Insert into the appropriate detail table
        if (property_kind === 'Land') {
            const { 
                au_code, psc_code, lot_area, shape, topography, 
                corner_lot, road_access, additional_adj_factor, remarks 
            } = details;
            
            const [landResult] = await connection.query(`
                INSERT INTO PropertyLand (
                    property_id, au_code, psc_code, lot_area, shape, 
                    topography, corner_lot, road_access, additional_adj_factor, remarks
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                property_id, au_code, psc_code, lot_area, shape, 
                topography, corner_lot, road_access, additional_adj_factor, remarks || null
            ]);
            const land_id = landResult.insertId;

            //I need to insert here all of the improvements
            /// improvements is an array improvements
            if(improvements.length > 0){
                const values = improvements.map(item => [
                    land_id,
                    parseInt(item.i_id),
                    item.quantity
                ]);
                const sql = `
                    INSERT INTO landotherimprovements
                    (land_id, i_id, quantity)
                    VALUES ?
                `;
                await connection.query(sql, [values]);
            }

            //this shit bad
            // for (const item of improvements) {
            //     console.log(item)
            //     const sql = 'INSERT INTO landotherimprovements(land_id, improvement_name, quantity, unit_value) VALUES ?';
            //     await connection.query(sql, [land_id, item.improvement_name, item.quantity, item.unit_value]);
            // }


        } else if (property_kind === 'Building') {
            // const { building,  } = ;
            // console.log(building)
            const {
                bk_id, st_id, bau_id,
                no_of_storeys, year_constructed, remarks,
                floor_areas, structural_materials, additional_items
            } = req.body.details;

            // 1️⃣ Insert into PropertyBuilding
            const [buildingResult] = await connection.query(`
                INSERT INTO PropertyBuilding (
                    property_id, bk_id, st_id, bau_id, no_of_storeys, 
                    year_constructed, remarks
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                property_id, bk_id, st_id, bau_id, no_of_storeys || 1,
                year_constructed || null, remarks || null
            ]);

            const building_id = buildingResult.insertId;

            if (Array.isArray(floor_areas)) {
                for (const fa of floor_areas) {
                    const { floor_no, floor_area } = fa;
                    await connection.query(`
                        INSERT INTO BuildingFloorAreas (building_id, floor_no, floor_area)
                        VALUES (?, ?, ?)
                    `, [building_id, floor_no, floor_area]);
                }
            }

            if (Array.isArray(structural_materials)) {
                for (const sm of structural_materials) {
                    const { part, floor_no, material } = sm;
                    await connection.query(`
                        INSERT INTO BuildingStructuralMaterials (building_id, part, floor_no, material)
                        VALUES (?, ?, ?, ?)
                    `, [building_id, part, floor_no || null, material]);
                }
            }

            if (Array.isArray(additional_items)) {
                for (const item of additional_items) {
                    const { item_id, quantity } = item;
                    await connection.query(`
                        INSERT INTO BuildingAdditionalItems (building_id, item_id, quantity)
                        VALUES (?, ?, ?)
                    `, [building_id, item_id, quantity]);
                }
            }
        } else if (property_kind === 'Machinery') {
            // Destructure all fields from details
            const {
                mt_id,
                mau_id,
                brand_model,
                capacity_hp,
                date_acquired,
                condition,
                economic_life,
                remaining_life,
                year_installed,
                year_initial_operation,
                original_cost,
                conversion_factor,
                rcn,
                years_used,
                depreciation_rate,
                total_depreciation_value,
                depreciated_value,
                remarks
            } = details;

            // Dynamically include only non-empty fields
            const fields = ['property_id'];
            const values = [property_id];
            const placeholders = ['?'];

            for (const [key, value] of Object.entries({
                mt_id: Number(mt_id),
                mau_id: Number(mau_id),
                brand_model,
                capacity_hp,
                date_acquired,
                condition,
                economic_life,
                remaining_life,
                year_installed,
                year_initial_operation,
                original_cost,
                conversion_factor,
                rcn,
                years_used,
                depreciation_rate,
                total_depreciation_value,
                depreciated_value,
                remarks
            })) {
                if (value !== "" && value !== null && value !== 0) {
                    fields.push(`\`${key}\``);
                    values.push(value);
                    placeholders.push('?');
                }
            }

            const sql = `
                INSERT INTO PropertyMachinery (${fields.join(', ')})
                VALUES (${placeholders.join(', ')})
            `;
            await connection.query(sql, values);
        }

        //history header
        const [historyRes] = await connection.query(
            `INSERT INTO property_history(property_id, action, remarks)
             VALUES (?, 'CREATION', 'Initial property record created.')`,
            [property_id]
        );

        // 3. Commit the transaction
        await connection.commit();
        connection.release();

        res.status(201).json({ message: 'Property created successfully', property_id });

    } catch (err) {
        // 4. Rollback in case of any error
        await connection.rollback();
        connection.release();
        
        console.error('Database Error during property creation:', err);
        res.status(500).json({ 
            error: 'Failed to create property and details. Transaction rolled back.',
            details: err.message 
        });
    }
});


// this is direct update of the property, not a transasction
router.put('/set/:property_id', async (req, res) => {
    const { property_id } = req.params;

    const {
        arp_no, pin,
        lg_code, barangay, lot_no, block_no, property_kind,
        description, status,
        details, improvements, owners, editRemarks
    } = req.body;

    const connection = await pool.getConnection();

    const diffColumns = (oldRow, newRow) => {
        const diffs = [];
        for (const key of Object.keys(newRow)) {
            const oldVal = oldRow?.[key] ?? null;
            const newVal = newRow[key] ?? null;
            if (String(oldVal) !== String(newVal)) {
                diffs.push([key, oldVal, newVal]);
            }
        }
        return diffs;
    };

    try {
        await connection.beginTransaction();

        //history header
        const [historyRes] = await connection.query(
            `INSERT INTO property_history(property_id, action, remarks)
             VALUES (?, 'UPDATE', ?)`,
            [property_id, editRemarks]
        );
        const history_id = historyRes.insertId;

        const insertHistoryCols = async (rows) => {
            if (!rows.length) return;
            const values = rows.map(r => [history_id, ...r]);
            await connection.query(
                `INSERT INTO property_history_columns
                 (history_id, column_name, old_value, new_value)
                 VALUES ?`,
                [values]
            );
        };

        //owners setup
        const [[oldOwners]] = await connection.query(
            `SELECT 
                GROUP_CONCAT(
                    CONCAT_WS(' ',
                    CONCAT(oi.last_name, ','),
                    oi.first_name,
                    CONCAT(LEFT(NULLIF(oi.middle_name, ''), 1), '.'),
                    NULLIF(oi.suffix, '')
                    )
                    ORDER BY po.owner_id
                    SEPARATOR '| '
                ) AS owners
            FROM property_owners po
            JOIN owner_information oi 
                ON oi.owner_id = po.owner_id
            WHERE po.property_id = ?;`,
            [property_id]
        );

        await connection.query(
            `DELETE FROM property_owners
             WHERE property_id = ? AND owner_id NOT IN (?)`,
            [property_id, owners]
        );

        if (owners?.length) {
            const rows = owners.map(o => [property_id, o]);
            await connection.query(
                `INSERT IGNORE INTO property_owners (property_id, owner_id)
                 VALUES ?`,
                [rows]
            );
        }

        const [[newOwners]] = await connection.query(
            `SELECT 
                GROUP_CONCAT(
                    CONCAT_WS(' ',
                    CONCAT(oi.last_name, ','),
                    oi.first_name,
                    CONCAT(LEFT(NULLIF(oi.middle_name, ''), 1), '.'),
                    NULLIF(oi.suffix, '')
                    )
                    ORDER BY po.owner_id
                    SEPARATOR '| '
                ) AS owners
            FROM property_owners po
            JOIN owner_information oi 
                ON oi.owner_id = po.owner_id
            WHERE po.property_id = ?`,
            [property_id]
        );
        if (oldOwners?.owners !== newOwners?.owners) {
            await insertHistoryCols([
                ['owners', oldOwners?.owners, newOwners?.owners]
            ]);
        }

        //general info
        const [[oldMaster]] = await connection.query(
            `SELECT arp_no, pin, lg_code, barangay, lot_no,
                    block_no, property_kind, description, status
             FROM PropertyMasterList
             WHERE property_id = ?`,
            [property_id]
        );

        const newMaster = {
            arp_no, pin, lg_code, barangay,
            lot_no, block_no, property_kind,
            description, status
        };

        await connection.query(
            `UPDATE PropertyMasterList
             SET arp_no=?, pin=?, lg_code=?, barangay=?,
                 lot_no=?, block_no=?, property_kind=?,
                 description=?, status=?
             WHERE property_id=?`,
            [...Object.values(newMaster), property_id]
        );

        await insertHistoryCols(diffColumns(oldMaster, newMaster));

        if (property_kind === 'Land') {
            const { au_code, psc_code, lot_area, remarks } = details;

            const [[oldLand]] = await connection.query(
                `SELECT au_code, psc_code, lot_area, remarks
                 FROM PropertyLand WHERE property_id=?`,
                [property_id]
            );

            const newLand = { au_code, psc_code, lot_area, remarks };
            if(newLand.remarks === '') newLand.remarks = null; //
            newLand.lot_area = newLand.lot_area.toFixed(2); // this is to get the original value, which is string on the database
            

            await connection.query(
                `UPDATE PropertyLand
                 SET au_code=?, psc_code=?, lot_area=?, remarks=?
                 WHERE property_id=?`,
                [au_code, psc_code, lot_area, remarks || null, property_id]
            );

            await insertHistoryCols(diffColumns(oldLand, newLand));

            const [[landRow]] = await connection.query(
                `SELECT land_id FROM PropertyLand WHERE property_id=?`,
                [property_id]
            );

            if (landRow) {
                //fetch the original
                const [oldRows] = await connection.query(
                    `SELECT i_id, (SELECT improvement_name FROM land_improvements WHERE improvement_id = i_id) improvement_name, quantity FROM LandOtherImprovements WHERE land_id = ? ORDER BY i_id`,
                    [landRow.land_id]
                );

                await connection.query(
                    `DELETE FROM LandOtherImprovements WHERE land_id = ?`,
                    [landRow.land_id]
                );

                for (const i of improvements || []) {
                    await connection.query(
                        `INSERT INTO LandOtherImprovements
                        (land_id, i_id, quantity)
                        VALUES (?, ?, ?)`,
                        [landRow.land_id, i.i_id, i.quantity]
                    );
                }
                
                //fetch the updated
                const [newRows] = await connection.query(
                    `SELECT i_id, (SELECT improvement_name FROM land_improvements WHERE improvement_id = i_id) improvement_name, quantity FROM LandOtherImprovements WHERE land_id = ? ORDER BY i_id`,
                    [landRow.land_id]
                );
                if(JSON.stringify(oldRows) !== JSON.stringify(newRows)){
                    for (const i of oldRows || []) {
                        await connection.query(
                            `INSERT INTO property_history_land_improvements
                            (history_id, type, improvement_name, quantity)
                            VALUES (?, 'OLD', ?, ?)`,
                            [history_id, i.improvement_name, i.quantity]
                        );
                    }
                    for (const i of newRows || []) {
                        await connection.query(
                            `INSERT INTO property_history_land_improvements
                            (history_id, type, improvement_name, quantity)
                            VALUES (?, 'NEW', ?, ?)`,
                            [history_id, i.improvement_name, i.quantity]
                        );
                    }
                }
            }
        }
        if (property_kind === 'Building') {
            const {
                bk_id, st_id, bau_id,
                no_of_storeys, year_constructed, remarks,
                floor_areas, structural_materials, additional_items
            } = details;

            const [[oldBuilding]] = await connection.query(
                `SELECT bk_id, st_id, bau_id, no_of_storeys,
                        year_constructed, remarks
                 FROM PropertyBuilding WHERE property_id=?`,
                [property_id]
            );

            const newBuilding = {
                bk_id, st_id, bau_id,
                no_of_storeys, year_constructed, remarks
            };
            if(newBuilding.remarks === '') newBuilding.remarks = null; //

            await connection.query(
                `UPDATE PropertyBuilding
                 SET bk_id=?, st_id=?, bau_id=?, no_of_storeys=?,
                     year_constructed=?, remarks=?
                 WHERE property_id=?`,
                [
                    bk_id, st_id, bau_id,
                    no_of_storeys || 1,
                    year_constructed || null,
                    remarks || null,
                    property_id
                ]
            );

            await insertHistoryCols(diffColumns(oldBuilding, newBuilding));

            const [[b]] = await connection.query(
                `SELECT building_id FROM PropertyBuilding WHERE property_id=?`,
                [property_id]
            );

            //old data
            const [[oldAreas], [oldMaterials], [oldItems]] = await Promise.all([
                await connection.query(`SELECT floor_no, floor_area FROM BuildingFloorAreas WHERE building_id = ?`, [b.building_id]),
                await connection.query(`SELECT part, floor_no, material FROM buildingstructuralmaterials WHERE building_id = ?`, [b.building_id]),
                await connection.query(`SELECT bai.quantity, (SELECT bi.item_name FROM building_items bi WHERE bi.item_id = bai.item_id) item_name FROM buildingadditionalitems bai WHERE bai.building_id = ?`, [b.building_id]),
            ]);


            await connection.query(`DELETE FROM BuildingFloorAreas WHERE building_id=?`, [b.building_id]);
            await connection.query(`DELETE FROM BuildingStructuralMaterials WHERE building_id=?`, [b.building_id]);
            await connection.query(`DELETE FROM BuildingAdditionalItems WHERE building_id=?`, [b.building_id]);
        

            for (const fa of floor_areas || []) {
                await connection.query(
                    `INSERT INTO BuildingFloorAreas
                     (building_id, floor_no, floor_area)
                     VALUES (?, ?, ?)`,
                    [b.building_id, fa.floor_no, fa.floor_area]
                );
            }

            for (const sm of structural_materials || []) {
                await connection.query(
                    `INSERT INTO BuildingStructuralMaterials
                     (building_id, part, floor_no, material)
                     VALUES (?, ?, ?, ?)`,
                    [b.building_id, sm.part, sm.floor_no || null, sm.material]
                );
            }

            for (const ai of additional_items || []) {
                await connection.query(
                    `INSERT INTO BuildingAdditionalItems
                     (building_id, item_id, quantity)
                     VALUES (?, ?, ?)`,
                    [b.building_id, ai.item_id, ai.quantity]
                );
            }
            
            const [[newAreas], [newMaterials], [newItems]] = await Promise.all([
                await connection.query(`SELECT floor_no, floor_area FROM BuildingFloorAreas WHERE building_id = ?`, [b.building_id]),
                await connection.query(`SELECT part, floor_no, material FROM buildingstructuralmaterials WHERE building_id = ?`, [b.building_id]),
                await connection.query(`SELECT bai.quantity, (SELECT bi.item_name FROM building_items bi WHERE bi.item_id = bai.item_id) item_name FROM buildingadditionalitems bai WHERE bai.building_id = ?`, [b.building_id]),
            ]);

            //insert to da damn history
            if(JSON.stringify(oldAreas) !== JSON.stringify(newAreas)){
                for (const i of oldAreas || []) {
                    await connection.query(
                        `INSERT INTO property_history_bfloorarea
                        (history_id, type, floor_no, floor_area)
                        VALUES (?, 'OLD', ?, ?)`,
                        [history_id, i.floor_no, i.floor_area]
                    );
                }
                for (const i of newAreas || []) {
                    await connection.query(
                        `INSERT INTO property_history_bfloorarea
                        (history_id, type, floor_no, floor_area)
                        VALUES (?, 'NEW', ?, ?)`,
                        [history_id, i.floor_no, i.floor_area]
                    );
                }
            }
            if(JSON.stringify(oldMaterials) !== JSON.stringify(newMaterials)){

                for (const i of oldMaterials || []) {
                    await connection.query(
                        `INSERT INTO property_history_bstructuralmaterials
                        (history_id, type, part, floor_no, material)
                        VALUES (?, 'OLD', ?, ?, ?)`,
                        [history_id, i.part, i.floor, i.material]
                    );
                }
                for (const i of newMaterials || []) {
                    await connection.query(
                        `INSERT INTO property_history_bstructuralmaterials
                        (history_id, type, part, floor_no, material)
                        VALUES (?, 'NEW', ?, ?, ?)`,
                        [history_id, i.part, i.floor_no, i.material]
                    );
                }
            }
            if(JSON.stringify(oldItems) !== JSON.stringify(newItems)){
                for (const i of oldItems || []) {
                    await connection.query(
                        `INSERT INTO property_history_badditionalitems
                        (history_id, type, item_name, quantity)
                        VALUES (?, 'OLD', ?, ?)`,
                        [history_id, i.item_name, i.quantity]
                    );
                }
                for (const i of newItems || []) {
                    await connection.query(
                        `INSERT INTO property_history_badditionalitems
                        (history_id, type, item_name, quantity)
                        VALUES (?, 'NEW', ?, ?)`,
                        [history_id, i.item_name, i.quantity]
                    );
                }
            }

            // console.log(JSON.stringify(oldAreas) !== JSON.stringify(newAreas), JSON.stringify(oldMaterials) !== JSON.stringify(newMaterials), JSON.stringify(oldItems) !== JSON.stringify(newItems))
            // console.log(oldAreas, newAreas)
        }
        if (property_kind === 'Machinery') {
            if(details.date_acquired === '') details.date_acquired = null;
            if(details.remarks === '') details.remarks = null; //
            details.original_cost = details.original_cost.toFixed(2);
            details.conversion_factor = details.conversion_factor.toFixed(2);
            details.depreciation_rate = details.depreciation_rate.toFixed(2);
            details.total_depreciation_value = details.total_depreciation_value.toFixed(2);
            details.depreciated_value = details.depreciated_value.toFixed(2);
            details.rcn = details.rcn.toFixed(2);
            console.log(details);
            const [[oldMach]] = await connection.query(
                `SELECT * FROM PropertyMachinery WHERE property_id=?`,
                [property_id]
            );

            await connection.query(
                `UPDATE PropertyMachinery SET ? WHERE property_id=?`,
                [details, property_id]
            );

            await insertHistoryCols(diffColumns(oldMach, details));
        }

        await connection.commit();
        connection.release();

        res.json({ message: 'Property updated with history', property_id });

    } catch (err) {
        await connection.rollback();
        connection.release();
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/history/:property_id', async (req, res) => {
    try{
        const { property_id } = req.params;
        const sql = `SELECT ph.*, (SELECT pm.property_kind FROM propertymasterlist pm WHERE pm.property_id = ph.property_id) AS property_kind FROM property_history ph WHERE ph.property_id = ? ORDER BY change_ts DESC`;
        const [data] = await pool.query(sql, [property_id]);

        res.json(data);

    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
}); 

router.get('/history/details/:history_id', async (req, res) => {
    try{
        const { history_id } = req.params;
        const generalSql = `SELECT * FROM property_history_columns WHERE history_id = ?`;
        const [general] = await pool.query(generalSql, [history_id]);

        const land_improvementsSql = `SELECT * FROM property_history_land_improvements WHERE history_id = ?`;
        const [land_improvements] = await pool.query(land_improvementsSql, [history_id]);

        const building_areasSql = `SELECT * FROM property_history_bfloorarea WHERE history_id = ?`;
        const [building_areas] = await pool.query(building_areasSql, [history_id]);

        const building_materialsSql = `SELECT * FROM property_history_bstructuralmaterials WHERE history_id = ?`;
        const [building_materials] = await pool.query(building_materialsSql, [history_id]);

        const building_itemsSql = `SELECT * FROM property_history_badditionalitems WHERE history_id = ?`;
        const [building_items] = await pool.query(building_itemsSql, [history_id]);

        res.json({
            general: general,   
            land_improvements: land_improvements ?? [],
            building_areas: building_areas ?? [],
            building_materials: building_materials ?? [],
            building_items: building_items ?? []
        });

    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
}); 

router.get("/property/:property_id", async (req, res) => {
    const { property_id } = req.params;

    try {
        // 1️⃣ Get base property info
        const active = await getActive();
        const [property] = await pool.query(
            `SELECT 
                pml.*,
                (SELECT f.faas_id FROM faas f WHERE f.property_id = pml.property_id AND f.status = 'ACTIVE' LIMIT 1) AS faas_id
            FROM PropertyMasterList pml
            WHERE pml.property_id = ?
            `,
            [property_id]
        );

        const [owners] = await pool.query(
            `SELECT 
                oi.*,
                (SELECT CONCAT_WS(' ',
                    CONCAT(last_name, ','),
                    first_name,
                    CONCAT(LEFT(NULLIF(middle_name, ''), 1), '.'),
                    NULLIF(suffix, '')
                ) FROM owner_information WHERE owner_id = po.owner_id) as name,
                (SELECT address_house_no FROM owner_information WHERE owner_id = po.owner_id) as address
            FROM property_owners po
            LEFT JOIN owner_information oi ON oi.owner_id = po.owner_id 
            WHERE po.property_id = ?
            `,
            [property_id]
        );
        // console.log(owners);

        if (!property.length) {
            return res.status(404).json({ message: "Property not found" });
        }

        const main = property[0];
        let details = {};

        // 2️⃣ Get additional details based on property kind
        switch (main.property_kind) {
            case "Land": {
                const active = await getActive();
                const [land] = await pool.query(
                    `
                        SELECT 
                            pl.*,
                            CONCAT(pc.classname, ' (', pc.code, ')') AS classification,
                            CONCAT(psc.subclass_name, ' (', psc.code, ')') AS subclassification,
                            CONCAT(au.use_name, ' (', au.code, ')') AS actualuse,
                            pc.code AS pc_code,
                            au.taxable,
                            au.assessment_level
                        FROM PropertyLand pl 
                        LEFT JOIN propertysubclassification psc ON psc.code = pl.psc_code AND psc.ry_id = ?
                        LEFT JOIN propertyclassification pc ON pc.pc_id = psc.pc_id
                        LEFT JOIN actualuse au ON au.code = pl.au_code AND au.ry_id = ?
                        WHERE property_id = ?
                    `,
                    [active, active, property_id]
                );

                if (land.length) {
                    const [improvements] = await pool.query(
                        `SELECT 
                            loi.*, 
                            li.improvement_name 
                        FROM LandOtherImprovements loi 
                        LEFT JOIN land_improvements li 
                            ON li.improvement_id = loi.i_id 
                        WHERE loi.land_id = ?`,
                        [land[0].land_id]
                    );
                    details = { ...land[0], other_improvements: improvements };
                }
                break;
            }

            case "Building": {
                const [building] = await pool.query(
                    `SELECT 
                        pb.*,
                        CONCAT(bk.name, ' (', bk.code, ')') AS buildingkind,
                        CONCAT(st.name, ' (', st.code, ')') AS structuraltype,
                        CONCAT(bau.use_name, ' (', bau.use_code, ')') AS actualuse,
                        bau.assessment_level,
                        bau.taxable
                    FROM PropertyBuilding pb
                    LEFT JOIN buildingkind bk ON bk.bk_id = pb.bk_id
                    LEFT JOIN structuraltype st ON st.st_id = pb.st_id
                    LEFT JOIN buildingactualuse bau ON bau.bau_id = pb.bau_id AND bau.ry_id = ?
                    WHERE property_id = ?`,
                    [active, property_id]
                );

                if (building.length) {
                    const [floors] = await pool.query(
                        "SELECT * FROM BuildingFloorAreas WHERE building_id = ?",
                        [building[0].building_id]
                    );
                    const [materials] = await pool.query(
                        "SELECT * FROM BuildingStructuralMaterials WHERE building_id = ?",
                        [building[0].building_id]
                    );
                    const [additions] = await pool.query(
                        `SELECT 
                            bai.*,
                            bi.item_name 
                        FROM BuildingAdditionalItems bai 
                        LEFT JOIN building_items bi ON bi.item_id = bai.item_id
                        WHERE building_id = ?`,
                        [building[0].building_id]
                    );
                    details = {
                        ...building[0],
                        floor_areas: floors,
                        structural_materials: materials,
                        additional_items: additions,
                    };
                }
                break;
            }

            case "Machinery": {
                const [machinery] = await pool.query(
                    `
                        SELECT 
                            pm.*,
                            mau.taxable,
                            mau.assessment_level,
                            CONCAT(mau.use_name, ' (', mau.use_code, ')') AS actualuse,
                            mt.name AS machinerytype
                        FROM PropertyMachinery pm
                        LEFT JOIN machineryactualuse mau ON mau.mau_id = pm.mau_id AND mau.ry_id = ?
                        LEFT JOIN machinerytype mt ON mt.mt_id = pm.mt_id 
                        WHERE property_id = ?
                    `,
                    [active, property_id]
                );
                if (machinery.length) details = machinery[0];
                break;
            }

            default:
                break;
        }

        // 3️⃣ Return combined result
        res.json({
            ...main,
            details,
            owners
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
});

router.post('/landDetails', async (req, res) => {
    try {
        const {
            property_id, au_code, psc_code, lot_area,
            shape, topography, corner_lot,
            road_access, additional_adj_factor, remarks
        } = req.body;

        const sql = `
            INSERT INTO PropertyLand 
            (property_id, au_code, psc_code, lot_area, shape, topography, corner_lot, road_access, additional_adj_factor, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await pool.query(sql, [
            property_id, au_code, psc_code, lot_area, shape, topography, corner_lot,
            road_access, additional_adj_factor, remarks
        ]);

        res.status(201).json({ message: 'PropertyLand added successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json("Internal Server Error!");
    }
});

router.post('/buildingDetails', async (req, res) => {
    try {
        const {
            property_id, bk_id, pc_code, floor_area,
            no_of_storeys, year_constructed, depreciation_rate,
            additional_adj_factor, remarks
        } = req.body;

        const sql = `
            INSERT INTO PropertyBuilding
            (property_id, bk_id, pc_code, floor_area, no_of_storeys, year_constructed,
            depreciation_rate, additional_adj_factor, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await pool.query(sql, [
            property_id, bk_id, pc_code, floor_area,
            no_of_storeys, year_constructed, depreciation_rate,
            additional_adj_factor, remarks
        ]);

        res.status(201).json({ message: 'PropertyBuilding added successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json("Internal Server Error!");
    }
});

router.post('/machineryDetails', async (req, res) => {
    try {
        const {
            property_id, pc_code, machine_description, mt_id, year_acquired,
            acquisition_cost, estimated_life, depreciation_rate,
            operational_condition, remarks
        } = req.body;

        const sql = `
            INSERT INTO PropertyMachinery
            (property_id, pc_code, machine_description, mt_id, year_acquired,
            acquisition_cost, estimated_life, depreciation_rate, operational_condition, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await pool.query(sql, [
            property_id, pc_code, machine_description, mt_id, year_acquired,
            acquisition_cost, estimated_life, depreciation_rate,
            operational_condition, remarks
        ]);

        res.status(201).json({ message: 'PropertyMachinery added successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json("Internal Server Error!");
    }
});


router.put('/set', async (req, res) => {
    try {
        const fields = Object.keys(req.body);
        const values = Object.values(req.body);
        const id_field = fields.shift();
        const id_val = values.shift();

        if (fields.length === 0)
        return res.status(400).json({ error: 'No fields provided' });

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const sql = `UPDATE PropertyMasterList SET ${setClause} WHERE property_id = ?`;

        await pool.query(sql, [...values, id_val]);
        res.json({ message: 'Property updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/landDetails', async (req, res) => {
    try {
        const {
            property_id, shape, topography, corner_lot,
            road_access, additional_adj_factor, remarks
        } = req.body;

        const sql = `
            UPDATE PropertyLand 
            SET shape = ?, topography = ?, corner_lot = ?, 
                road_access = ?, additional_adj_factor = ?, remarks = ?
            WHERE property_id = ?
        `;

        const [result] = await pool.query(sql, [
            shape, topography, corner_lot, road_access,
            additional_adj_factor, remarks, property_id
        ]);

        if (result.affectedRows === 0)
            return res.status(404).json({ message: 'PropertyLand not found!' });

        res.status(200).json({ message: 'PropertyLand updated successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json("Internal Server Error!");
    }
});


router.put('/buildingDetails', async (req, res) => {
    try {
        const {
            property_id, bk_id, floor_area,
            no_of_storeys, year_constructed, depreciation_rate,
            additional_adj_factor, remarks
        } = req.body;

        const sql = `
            UPDATE PropertyBuilding
            SET bk_id = ?, floor_area = ?, no_of_storeys = ?, 
                year_constructed = ?, depreciation_rate = ?, 
                additional_adj_factor = ?, remarks = ?
            WHERE property_id = ?
        `;

        const [result] = await pool.query(sql, [
            bk_id, floor_area, no_of_storeys, year_constructed,
            depreciation_rate, additional_adj_factor, remarks, property_id
        ]);

        if (result.affectedRows === 0)
            return res.status(404).json({ message: 'PropertyBuilding not found!' });

        res.status(200).json({ message: 'PropertyBuilding updated successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json("Internal Server Error!");
    }
});


router.put('/machineryDetails', async (req, res) => {
    try {
        const {
            property_id, pc_code, machine_description, mt_id, year_acquired,
            acquisition_cost, estimated_life, depreciation_rate,
            operational_condition, remarks
        } = req.body;

        const sql = `
            UPDATE PropertyMachinery
            SET machine_description = ?, pc_code = ?, mt_id = ?, year_acquired = ?, 
                acquisition_cost = ?, estimated_life = ?, 
                depreciation_rate = ?, operational_condition = ?, remarks = ?
            WHERE property_id = ?
        `;

        const [result] = await pool.query(sql, [
            machine_description, pc_code, mt_id, year_acquired, acquisition_cost,
            estimated_life, depreciation_rate, operational_condition, remarks, property_id
        ]);

        if (result.affectedRows === 0)
            return res.status(404).json({ message: 'PropertyMachinery not found!' });

        res.status(200).json({ message: 'PropertyMachinery updated successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json("Internal Server Error!");
    }
});

// router.get('/history/:id', async (req, res) => {
//     try {
//         const [rows] = await pool.query(
//         `SELECT * FROM PropertyMasterList_History 
//         WHERE property_id = ? 
//         ORDER BY changed_at DESC`,
//         [req.params.id]
//         );
//         res.json(rows);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Failed to fetch history' });
//     }
// });


router.delete('/del', async (req, res) => {
    try {
        await pool.query(`
        UPDATE PropertyMasterList SET status = 'INACTIVE' WHERE property_id = ?
        `, [req.query.property_id]);
        res.json({ message: 'Property marked as INACTIVE' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});





export default router;