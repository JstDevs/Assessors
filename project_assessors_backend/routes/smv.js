import express from "express";
import pool from "../db.js";
import { getActive } from "./global.js";

const router = express.Router();
const land = "smv_land";
const building = "smv_building";
const machinery = "smv_machinery";


//land
router.get('/landList', async (req, res) =>{
    try{
        const active = await getActive();
        const sql = `
                SELECT 
                    lnd.*,
                    (
                        SELECT lg.code FROM locationalgroup AS lg WHERE lg_id = lnd.lg_id LIMIT 1
                    ) AS location,
                    (
                        SELECT psc.code FROM propertysubclassification AS psc WHERE psc_id = lnd.psc_id LIMIT 1
                    ) AS subclass
                FROM ${land} AS lnd WHERE ry_id = ?
        `;
        const [result] = await pool.query(sql, [active]);

        res.json({ success: true, message: "Success in fetching List", data: result});

    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});

router.post('/addLand', async (req, res)=>{
    try{
        const active = await getActive();
        const {
            lg_id,
            psc_id,
            unit_value,
            effective_date,
            ordinance_no,
            approved_by,
            remarks
        } = req.body;

        const insertQuery = `
        INSERT INTO smv_land (
            ry_id, lg_id, psc_id, unit_value, effective_date, 
            ordinance_no, approved_by, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;


        const [result] = await pool.query(insertQuery, [
            active,
            lg_id,
            psc_id,
            unit_value,
            effective_date,
            ordinance_no || null,
            approved_by || null,
            remarks || null
        ]);
        res.json({success: true, message: "Successfully Added!"})
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
  
});

router.get('/getLand', async (req, res) => {
    const { smv_land_id } = req.query;
    try {
        const sql = `SELECT 
                        smv_land_id, ry_id, lg_id, psc_id, unit_value, effective_date,
                        ordinance_no, approved_by, remarks
                    FROM SMV_Land 
                    WHERE smv_land_id = ?`;
        const [row] = await pool.query( sql, [Number(smv_land_id)]);

        res.json({success: true, message: "Data fetched successfully!", data: row[0]});
    } catch (error) {
        console.error('Error fetching Land SMV:', error);
        res.status(500).json({
        success: false,
        message: 'Failed to retrieve Land SMV record'
        });
    }
});
// PUT /smv/updateland
router.put('/setLand', async (req, res) => {
    const {
        smv_land_id,
        unit_value,
        effective_date,
        ordinance_no,
        approved_by,
        remarks
    } = req.body;

    try {

        // 💾 Update
        const sql = `
        UPDATE SMV_Land 
        SET 
            unit_value = ?, 
            effective_date = ?, 
            ordinance_no = ?, 
            approved_by = ?, 
            remarks = ?
        WHERE smv_land_id = ?
        `;

        await pool.query(sql, [
            unit_value,
            effective_date,
            ordinance_no || null,
            approved_by || null,
            remarks || null,
            smv_land_id
        ]);

        res.json({
            success: true,
            message: 'Land SMV updated successfully'
        });
    } catch (error) {
        console.error('Error updating Land SMV:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update Land SMV record'
        });
    }
});

router.delete('/deleteLand', async (req, res) => {
    const { smv_land_id } = req.query;

    // ✅ Validate input
    if (!smv_land_id || isNaN(Number(smv_land_id))) {
        return res.status(400).json({
        success: false,
        message: 'Valid smv_land_id is required'
        });
    }
    const id = Number(smv_land_id);
    try {
        
        const [result] = await pool.query(
            `DELETE FROM SMV_Land WHERE smv_land_id = ?`,
            [id]
        );

        // Note: result.affectedRows is 1 if deleted, 0 if not found (but we already checked)

        res.json({
            success: true,
            message: 'Land SMV record deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting Land SMV:', error);
        // Handle foreign key constraint errors (e.g., if used in assessments)
        if ((error).code === 'ER_ROW_IS_REFERENCED_2' || (error).errno === 1451) {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete: this Land SMV is currently in use'
            });
        }
        res.status(500).json({
        success: false,
        message: 'Failed to delete Land SMV record'
        });
    }
});

//building
router.get('/buildingList', async (req, res) =>{
    try{
        const active = await getActive();
        const sql = `
                SELECT 
                    smv.*,
                    (SELECT CONCAT(bk.name, ' (', pc.code , ')') FROM buildingkind bk LEFT JOIN propertyclassification pc ON pc.pc_id = bk.pc_id WHERE smv.bk_id = bk.bk_id) AS buildingkind,
                    (SELECT CONCAT(name, ' (', code , ')') FROM structuraltype st WHERE smv.st_id = st.st_id) AS structuraltype
                FROM smv_building smv 
                WHERE 
                    ry_id = ?`;
        const [result] = await pool.query(sql, [active]);

        res.json({ success: true, message: "Success in fetching List", data: result});

    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});
router.get('/kindList', async (req, res) =>{
    try{
        const sql = `
                SELECT * FROM buildingkind
        `;
        const [result] = await pool.query(sql, []);

        res.json({ success: true, message: "Success in fetching List", data: result});

    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});

router.post('/addBuilding', async (req, res)=>{
    try{
        const active = await getActive();
        const {
            bk_id,
            st_id,
            unit_value,
            effective_date,
            ordinance_no,
            approved_by,
            remarks
        } = req.body;

        const insertQuery = `
        INSERT INTO smv_building (
            ry_id, bk_id, st_id, unit_value, effective_date, 
            ordinance_no, approved_by, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        console.log(st_id);

        const [result] = await pool.query(insertQuery, [
            active,
            bk_id,
            st_id,
            unit_value,
            effective_date,
            ordinance_no || null,
            approved_by || null,
            remarks || null
        ]);
        res.json({success: true, message: "Successfully Added!"})
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
  
});

router.get('/getBuilding', async (req, res) => {
    const { smv_building_id } = req.query;
    try {
        const sql = `SELECT 
                        smv.*,
                        (SELECT code FROM buildingkind WHERE bk_id = smv.bk_id LIMIT 1) bk_name
                    FROM smv_building smv
                    WHERE smv.smv_building_id = ?`;
        const [row] = await pool.query( sql, [Number(smv_building_id)]);

        res.json({success: true, message: "Data fetched successfully!", data: row[0]});
    } catch (error) {
        console.error('Error fetching Land SMV:', error);
        res.status(500).json({
        success: false,
        message: 'Failed to retrieve Land SMV record'
        });
    }
});

router.put('/setBuidling', async (req, res) => {
    const {
        smv_building_id,
        unit_value,
        // depreciation_rate,
        effective_date,
        ordinance_no,
        approved_by,
        remarks
    } = req.body;

    try {

        // 💾 Update
        const sql = `
            UPDATE smv_building
            SET 
                unit_value = ?, 
                effective_date = ?, 
                ordinance_no = ?, 
                approved_by = ?, 
                remarks = ?
            WHERE smv_building_id = ?
        `;

        await pool.query(sql, [
            unit_value,
            effective_date,
            ordinance_no || null,
            approved_by || null,
            remarks || null,
            smv_building_id
        ]);

        res.json({
            success: true,
            message: 'Building SMV updated successfully'
        });
    } catch (error) {
        console.error('Error updating Building SMV:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update Building SMV record'
        });
    }
});

router.delete('/deleteBuilding', async (req, res) => {
    const { smv_building_id } = req.query;

    if (!smv_building_id || isNaN(Number(smv_building_id))) {
        return res.status(400).json({
        success: false,
        message: 'Valid smv_building_id is required'
        });
    }
    const id = Number(smv_building_id);
    try {
        
        const [result] = await pool.query(
            `DELETE FROM smv_building WHERE smv_building_id = ?`,
            [id]
        );

        res.json({
            success: true,
            message: 'Land SMV record deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting Land SMV:', error);
        if ((error).code === 'ER_ROW_IS_REFERENCED_2' || (error).errno === 1451) {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete: this Land SMV is currently in use'
            });
        }
        res.status(500).json({
        success: false,
        message: 'Failed to delete Land SMV record'
        });
    }
});

//building
router.get('/machineryList', async (req, res) =>{
    try{
        const active = await getActive();
        const sql = `
                SELECT 
                    *,
                    (
                        SELECT name FROM machinerytype WHERE mt_id = smv.mt_id LIMIT 1
                    ) mt_name
                FROM smv_machinery smv
                WHERE ry_id = ?
                `;
        const [result] = await pool.query(sql, [active]);

        res.json({ success: true, message: "Success in fetching List", data: result});

    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});

router.post('/addMachinery', async (req, res)=>{
    try{
        const active = await getActive();
        const {
            mt_id,
            unit_value,
            effective_date,
            ordinance_no,
            approved_by,
            remarks
        } = req.body;

        const insertQuery = `
        INSERT INTO smv_machinery (
            ry_id, mt_id, unit_value, effective_date, 
            ordinance_no, approved_by, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;


        const [result] = await pool.query(insertQuery, [
            active,
            mt_id,
            unit_value,
            effective_date,
            ordinance_no || null,
            approved_by || null,
            remarks || null
        ]);
        res.json({success: true, message: "Successfully Added!"})
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
  
});

router.get('/getMachinery', async (req, res) => {
    const { smv_machinery_id } = req.query;
    try {
        const sql = `SELECT 
                        smv.*,
                        (SELECT code FROM machinerytype WHERE mt_id = smv.mt_id LIMIT 1) mt_name
                    FROM smv_machinery smv
                    WHERE smv.smv_machinery_id = ?`;
        const [row] = await pool.query( sql, [Number(smv_machinery_id)]);
        res.json({success: true, message: "Data fetched successfully!", data: row[0]});
    } catch (error) {
        console.error('Error fetching Machinery SMV:', error);
        res.status(500).json({
        success: false,
        message: 'Failed to retrieve Land machinery record'
        });
    }
});

router.put('/setMachinery', async (req, res) => {
    const {
        smv_machinery_id,
        base_value,
        depreciation_rate,
        effective_date,
        ordinance_no,
        approved_by,
        remarks
    } = req.body;

    try {

        // 💾 Update
        const sql = `
            UPDATE smv_machinery
            SET 
                base_value = ?, 
                depreciation_rate = ?, 
                effective_date = ?, 
                ordinance_no = ?, 
                approved_by = ?, 
                remarks = ?
            WHERE smv_machinery_id = ?
        `;

        await pool.query(sql, [
            base_value,
            depreciation_rate,
            effective_date,
            ordinance_no || null,
            approved_by || null,
            remarks || null,
            smv_machinery_id
        ]);

        res.json({
            success: true,
            message: 'Machinery SMV updated successfully'
        });
    } catch (error) {
        console.error('Error updating Building SMV:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update Machinery SMV record'
        });
    }
});

router.delete('/deleteMachinery', async (req, res) => {
    const { smv_machinery_id } = req.query;

    if (!smv_machinery_id || isNaN(Number(smv_machinery_id))) {
        return res.status(400).json({
        success: false,
        message: 'Valid smv_machinery_id is required'
        });
    }
    const id = Number(smv_machinery_id);
    try {
        
        const [result] = await pool.query(
            `DELETE FROM smv_machinery WHERE smv_machinery_id = ?`,
            [id]
        );

        res.json({
            success: true,
            message: 'Machinery SMV record deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting Machinery SMV:', error);
        if ((error).code === 'ER_ROW_IS_REFERENCED_2' || (error).errno === 1451) {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete: this Machinery SMV is currently in use'
            });
        }
        res.status(500).json({
        success: false,
        message: 'Failed to delete Machinery SMV record'
        });
    }
});


// selector

router.get('/lgList', async (req, res) => {
    try{
        const active = await getActive();
        const sql = `
            SELECT lg.lg_id, lg.code, lg.name, lg.zone_type
            FROM LocationalGroup lg
            WHERE ry_id = ?
        `;
        const [result] = await pool.query(sql, [active]);
        res.json({success: true, message: "Success fetching data", data: result});
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});
router.get('/scList', async (req, res) => {
    try{
        const active = await getActive();
        const { lg_id } = req.query;
        const sql = 
        `
            SELECT 
                lg.lg_id,
                lg.code AS lg_code,
                lg.name AS lg_name,
                lg.zone_type,
                psc.psc_id,
                psc.code AS psc_code,
                psc.subclass_name,
                pc.classname
            FROM 
                LocationalGroup lg
                CROSS JOIN PropertySubclassification psc
                INNER JOIN PropertyClassification pc ON psc.pc_id = pc.pc_id
                LEFT JOIN SMV_Land smv 
                    ON smv.lg_id = lg.lg_id 
                    AND smv.psc_id = psc.psc_id 
                    AND smv.ry_id = ?
            WHERE 
                lg.ry_id = ?
                AND psc.ry_id = ?
                AND lg.active = TRUE
                AND psc.active = TRUE
                AND smv.smv_land_id IS NULL
                AND lg.lg_id = ?
            ORDER BY lg.code, psc.code;
        `;
        const [result] = await pool.query(sql, [active, active, active, lg_id]);
        res.json({success: true, message: "Success fetching data", data: result});
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});

router.get('/bkList', async(req, res)=>{
    try{
        const sql = 
        `
            SELECT * FROM buildingkind
        `;
        const [result] = await pool.query(sql);
        res.json({success: true, message: "Success fetching data", data: result});
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
})

router.get('/stList', async(req, res)=>{
    try{
        const active = await getActive();
        const { bk_id } = req.query;
        console.log(bk_id)
        const sql = 
        `
            SELECT 
                DISTINCT st.st_id,
                st.code,
                st.name 
            FROM structuraltype st
            CROSS JOIN buildingkind bk
            LEFT JOIN smv_building smv
                ON smv.st_id = st.st_id
                AND smv.bk_id = ?
                AND smv.ry_id = ?
            WHERE 
                smv.smv_building_id IS NULL
        `;
        const [result] = await pool.query(sql, [bk_id, active]);
        res.json({success: true, message: "Success fetching data", data: result});
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
})

router.get('/mtList', async(req, res) => {
    try{
        const active = await getActive();
        const sql = 
        `
            SELECT 
                mt.* 
            FROM machinerytype mt
            LEFT JOIN smv_machinery smv 
                ON smv.mt_id = mt.mt_id AND ry_id = ?
            WHERE 
                smv_machinery_id IS NULL
        `;
        const [result] = await pool.query(sql, [active]);
        res.json({success: true, message: "Success fetching data", data: result});
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});

router.get('/list', async (req, res) => {
    try{
        const active = await getActive();
        const sql = `SELECT * FROM ${smv} WHERE ry_id = ?`
        const [response] = await pool.query(sql, [active]);

        res.json({success: true, message: "list fetched successfully!", data: response});
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

router.get('/landSMV', async (req, res)=>{
    try{
        const { psc_id, lg_id, ry_id } = req.query;
        const sql = `SELECT 
                        * 
                    FROM smv_land
                    WHERE lg_id = ?
                        AND psc_id = ?
                        AND ry_id = ?`;
        
        const [data] = await pool.query(sql, [lg_id, psc_id, ry_id]);
        if(data.length <= 0){
            res.json({message: "SMV Not Found", data: 0, status: false});
            return
        }
        res.json({success: true, message:"Success!", data: data[0]});
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});

router.get('/buildingSMV', async (req, res)=>{
    try{
        const { bk_id, st_id, ry_id } = req.query;
        const sql = `SELECT 
                        * 
                    FROM smv_building
                    WHERE bk_id = ?
                        AND st_id = ?
                        AND ry_id = ?`;
        const [data] = await pool.query(sql, [bk_id, st_id, ry_id]);
        console.log("INPUTS:", bk_id, st_id, ry_id);
        console.log("SMV_BUILDING:", data.length);
        res.json({success: true, message:"Success!", data: data[0]});
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});

router.get('/machinerySMV', async (req, res)=>{
    try{
        const { mt_id, ry_id } = req.query;
        const sql = `SELECT 
                        * 
                    FROM smv_machinery
                    WHERE mt_id = ?
                        AND ry_id = ?`;
        const [data] = await pool.query(sql, [mt_id, ry_id]);
        res.json({success: true, message:"Success!", data: data[0]});
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});

router.get('/improvement/:id', async (req, res) => {
    try{
        const {id} = req.params;
        const active = await getActive();
        const sql = `
            SELECT 
                * 
            FROM improvements_unit_value 
            WHERE improvement_id = ? AND ry_id = ?
        `;
        const [data] = await pool.query(sql, [id, active]);
        res.json(data[0]);
    }catch(er){
        console.error(er);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});
router.get('/additional/:id', async (req, res) => {
    try{
        const {id} = req.params;
        const active = await getActive();
        const sql = `
            SELECT 
                * 
            FROM unit_values 
            WHERE item_id = ? AND ry_id = ?
        `;
        const [data] = await pool.query(sql, [id, active]);
        res.json(data[0]);
    }catch(er){
        console.error(er);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});

export default router;