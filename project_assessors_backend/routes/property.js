import express from "express";
import pool from "../db.js";
import { getActive } from "./global.js";

const router = express.Router();
const au = "actualuse";
const pc = "propertyclassification";
const psc = "propertysubclassification";


//Classification
router.get("/plist", async (req, res)=>{
    try{
        const active = await getActive();
        // console.log(active);
        if(!active) {
            res.json({error: "active revision year required!"});
            return;
        }
        const sqlPC = `SELECT * FROM ${pc}`;
        const [pcList] = await pool.query(sqlPC, {}) ;
        res.send(pcList);
    }catch(err){
        res.status(500).json( { error: "Internal Server Error!" } );
        console.log(err);
    }
})

router.post('/padd', async (req, res) => {
    try{
        const { code, classname, description } = req.body;

        const sql = `INSERT INTO ${pc} (code, classname, description) VALUES(?, ?, ?)`;
        const [result] = await pool.query(sql, [code, classname, description]);
        
        res.json({ success: true, insertedId: result.insertId });
    }catch(err){
        res.status(500).json({success: false, message: "Failed to update property"});
        console.log(err);
    }
});

router.put("/pupdate", async (req, res) => {
    try {
        const { pc_id, code, classname, description } = req.body;

        const sql = `
            UPDATE ${pc}
            SET code = ?, classname = ?, description = ?
            WHERE pc_id = ?
        `;

        const [result] = await pool.query(sql, [code, classname, description, pc_id]);

        res.json({
            success: true,
            message: result.affectedRows ? "Property updated successfully" : "No record updated",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to update property" });
    }
});

router.get("/pget", async (req, res)=>{
    try{
        const { pc_id } = req.query;
        const sql = `SELECT * FROM ${pc} WHERE pc_id = ?`;
        const [result] = await pool.query(sql,[pc_id]);
        res.json(result);
    }catch(err){
        res.status(500).json({success: false, message: "Internal Server Error!"});
        console.log(err);
    }
});

router.delete("/pdel", async (req, res) => {
    try {
        const { pc_id } = req.query;
        const sql = `DELETE FROM ${pc} WHERE pc_id = ?`;
        await pool.query(sql, [pc_id]);
        res.json({ success: true, message: `Property ${pc_id} deleted` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to delete property" });
    }
});

router.get('/getCID', async (req, res)=> {
    try{
        const { code } = req.query;
        const sql = `SELECT * FROM ${pc} WHERE code = ?`;
        const [result] = await pool.query(sql,[code]);
        res.json(result[0]);
    }catch(err){
        res.status(500).json({success: false, message: "Internal Server Error!"});
        console.log(err);
    }
});

//Sub Classification

router.get('/splist', async (req, res)=>{
    try{
        
        const active = await getActive();
        const { pc_id } = req.query;
        if(!pc_id || !active ) {
            res.json({error: "pc_id and active Required!"});
            return;
        }
        const sql = `SELECT * FROM ${psc} WHERE pc_id = ? and ry_id = ?`;
        const [result] = await pool.query(sql, [pc_id, active]);
        res.send(result);
    }catch(err){
        res.status(500).json({error: "Internal Server Error!"});
        console.log(err);
    }
});

router.get('/spget', async (req, res) => {
    try{
        const { psc_id } = req.query;
        const sql = `SELECT * FROM ${psc} WHERE psc_id = ?`;
        const [result] = await pool.query(sql, [psc_id]);
        res.send(result[0]); 
    }catch(err){
        res.status(500).json({error: "Internal Server Error!"});
        console.log(err);
    }
});

router.post('/spadd', async (req, res) => {
    try{
        const active = await getActive();
        const { ry_id, pc_id, code, subname, description, val_factor } = req.body;

        const sql = `INSERT INTO ${psc}(ry_id, pc_id, code, subclass_name, description, valuation_factor) VALUES(?, ?, ?, ?, ?, ?)`;
        const [result] = await pool.query(sql, [active, pc_id, code, subname, description, val_factor]);
        
        res.json({ success: true, insertedId: result.insertId });

    }catch(err){
        res.status(500).json({error: "Internal Server Error!"});
        console.log(err);
    }
});

router.put('/spset', async (req, res) => {
    try {
        const { psc_id, pc_id, code, subname, description, val_factor } = req.body;

        const sql = `
            UPDATE ${psc}
            SET pc_id = ?, 
                code = ?, 
                subclass_name = ?, 
                description = ?, 
                valuation_factor = ?
            WHERE psc_id = ?
        `;

        const [result] = await pool.query(sql, [
            pc_id,
            code,
            subname,
            description,
            val_factor,
            psc_id
        ]);

        res.json({ success: true, updatedId: psc_id });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error!" });
        console.log(err);
    }
});

router.delete('/spdel', async (req, res) => {
    try{
        const { psc_id } = req.query;
        const sql = `DELETE FROM ${psc} WHERE psc_id = ?`;
        const [result] = await pool.query(sql, [psc_id]);
        res.json({success: true, affectedRows: result.affectedRows});
    }catch(err){
        res.status(500).json({error: "Internal Server Error!"});
        console.log(err);
    }
});

router.get('/spgetid', async (req, res) => {
    try{
        const { code } = req.query;
        const sql = `SELECT pc_id FROM ${psc} WHERE code = ?`;
        const [data] = await pool.query(sql, [code]);
        res.json({success: true, message: "Success!", data: data[0]});
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});


router.get('/getSPID', async (req, res) => {
    try{
        const { code } = req.query;
        const sql = `SELECT psc_id FROM ${psc} WHERE code = ?`;
        const [data] = await pool.query(sql, [code]);
        res.json(data[0]);
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});



//Actual Use

router.get('/aulist', async (req, res)=>{
    try{
        const active = await getActive();
        const { pc_id } = req.query;
        if(!pc_id || !active) {
            res.json({error: "pc_id and active Required!"});
            return;
        }
        const sql = `SELECT * FROM ${au} WHERE pc_id = ? and ry_id = ?`;
        const [result] = await pool.query(sql, [pc_id, active]);
        res.send(result);
    }catch(err){
        res.status(500).json({error: "Internal Server Error!"});
        console.log(err);
    }
});

router.get('/auget', async (req, res) => {
    try{
        const { au_id } = req.query;
        const sql = `SELECT * FROM ${au} WHERE au_id = ?`;
        const [result] = await pool.query(sql, [au_id]);
        res.send(result[0]); 
    }catch(err){
        res.status(500).json({error: "Internal Server Error!"});
        console.log(err);
    }
});

router.post('/auadd', async (req, res) => {
    try {
        const active = await getActive();
        const { pc_id, code, use_name, taxable, exempt_percentage, assessment_level, notes, effective_date } = req.body;

        const sql = `
            INSERT INTO ${au} (ry_id, pc_id, code, use_name, taxable, exempt_percentage, assessment_level, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.query(sql, [
            active,
            pc_id,
            code,
            use_name,
            taxable ? 1 : 0,
            exempt_percentage || null,
            assessment_level || null,
            notes || null,
        ]);

        res.json({ success: true, insertedId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error!" });
        console.log(err);
    }
});

router.put('/auset', async (req, res) => {
    try {
        const { au_id, code, use_name, taxable, exempt_percentage, assessment_level, notes } = req.body;

        const sql = `
            UPDATE ${au}
            SET code = ?,
                use_name = ?,
                taxable = ?,
                exempt_percentage = ?,
                assessment_level = ?,
                description = ?
            WHERE au_id = ?
        `;

        const [result] = await pool.query(sql, [
            code,
            use_name,
            taxable ? 1 : 0,
            exempt_percentage || 0,
            assessment_level || 0,
            notes || null,
            au_id
        ]);

        res.json({ success: true, updatedId: au_id });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error!" });
        console.log(err);
    }
});

router.delete('/audel', async (req, res) => {
    try {
        const { au_id } = req.query;

        const sql = `DELETE FROM ${au} WHERE au_id = ?`;
        const [result] = await pool.query(sql, [au_id]);

        res.json({ success: true, affectedRows: result.affectedRows });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error!" });
        console.log(err);
    }
});

router.get('/augetlist', async (req, res) => {
    try{
        const active = await getActive();
        const sql = `SELECT * FROM ${au} WHERE ry_id = ?`;
        const [result] = await pool.query(sql, [active]);
        res.send(result); 
    }catch(err){
        res.status(500).json({error: "Internal Server Error!"});
        console.log(err);
    }
});




//mirror

router.get('/getSubclass', async (req, res) => {
    try {
        const active = await getActive();
        const { lg_id } = req.query
        const sql = `
            SELECT psc.*
            FROM propertysubclassification AS psc
            WHERE psc.ry_id = ?
            AND NOT EXISTS (
                SELECT 1
                FROM scheduleofmarketvalues AS smv
                WHERE smv.psc_id = psc.psc_id
                    AND smv.lg_id = ?
                    AND smv.ry_id = ?
            );
        `;

        const [result] = await pool.query(sql, [active, lg_id, active]);

        res.json({
            success: true,
            message: "Query Success!",
            data: result
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error!"
        });
    }
});


router.get('/bkList', async(req, res)=>{
    try{
        const sql = 
        `
            SELECT bk_id, CONCAT(name, ' (', code, ')') AS code FROM buildingkind
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
        const sql = 
        `
            SELECT st_id, CONCAT(name, ' (', code, ')') AS code FROM structuraltype
        `;
        const [result] = await pool.query(sql);
        res.json({success: true, message: "Success fetching data", data: result});
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
})


router.get('/bauList', async(req, res)=>{
    try{
        const sql = 
        `
            SELECT bau_id, CONCAT(use_name, ' (', use_code, ')') AS code, assessment_level, taxable FROM buildingactualuse
        `;
        const [result] = await pool.query(sql);
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
                mt_id,
                CONCAT(name, ' (', code, ')') AS code 
            FROM machinerytype 
        `;
        const [result] = await pool.query(sql, [active]);
        res.json({success: true, message: "Success fetching data", data: result});
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});

router.get('/mauList', async(req, res)=>{
    try{
        const sql = 
        `
            SELECT mau_id, CONCAT(use_name, ' (', use_code, ')') AS code, assessment_level, taxable FROM machineryactualuse
        `;
        const [result] = await pool.query(sql);
        res.json({success: true, message: "Success fetching data", data: result});
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
})

router.get('/mauID/:code', async (req, res)=>{
    const [data] = await pool.query(`SELECT * FROM machineryactualuse WHERE use_code = '${req.params.code}'`)
    res.json(data[0].mau_id);
})


router.get('/bauID/:code', async (req, res)=>{
    const [data] = await pool.query(`SELECT * FROM buildingactualuse WHERE use_code = '${req.params.code}'`)
    console.log(req.params.code);
    res.json(data[0]?.bau_id);
})

router.get('/stID/:code', async (req, res)=>{
    const [data] = await pool.query(`SELECT * FROM structuraltype WHERE code = '${req.params.code}'`)
    console.log(req.params.code);
    res.json(data[0]?.st_id);
})
router.get('/bkID/:code', async (req, res)=>{
    const [data] = await pool.query(`SELECT * FROM buildingkind WHERE code = '${req.params.code}'`)
    console.log(req.params.code);
    res.json(data[0]?.bk_id);
})

router.get('/pscID/:code', async (req, res)=>{
    const active = await getActive();
    const [data] = await pool.query(`SELECT * FROM propertysubclassification WHERE code = '${req.params.code}' AND ry_id = ${active}`)
    console.log(req.params.code);
    res.json(data[0]?.psc_id);
})


export default router;
