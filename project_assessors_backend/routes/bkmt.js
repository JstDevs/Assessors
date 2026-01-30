import express from "express";
import pool from "../db.js";
import { getActive } from "./global.js";

const router = express.Router();
const land = "smv_land";
const building = "smv_building";

router.get('/bkList', async (req, res) =>{
    try{
        // const active = await getActive();
        const sql = `SELECT * FROM buildingkind`; // should have active at some point
        const [result] = await pool.query(sql, []);

        res.json({ success: true, message: "Success in fetching List", data: result});

    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});

router.post('/bkAdd', async (req, res) => {
    try{
        const { code, name, description } = req.body;
        const sql = `INSERT INTO buildingkind(code, name, description) VALUES (?, ?, ?)`;
        await pool.query(sql, [code, name, description]);
        res.json({success: true, message: "Building Kind Created Successfully!"});
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
})

router.get('/bkGet', async (req, res) => {
    try{
        const { bk_id } = req.query;
        const sql = `SELECT * FROM buildingkind WHERE bk_id = ?`;
        const [result] = await pool.query(sql, [bk_id]);
        res.json({success: true, message: "Data loaded successfully!", data: result[0]});
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});

router.put('/bkSet', async (req, res) => {
    try{
        const { bk_id, code, name, description } = req.body;
        const sql = `
            UPDATE buildingkind
            SET code = ?, name = ?, description = ?
            WHERE bk_id = ?
            `; // should have active at some point
        const [result] = await pool.query(sql, [code, name, description, bk_id]);
        res.json({ success: true, message: "Success in Updating Building Kind"});
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});

router.delete('/bkDel', async (req, res)=> {
    try{
        const { bk_id } = req.query;
        const sql = `
            DELETE FROM buildingkind WHERE bk_id = ?
            `; // should have active at some point
        await pool.query(sql, [bk_id]);
        res.json({ success: true, message: "Success in Deleting Building Kind"});
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});


router.get('/bklist', async (req, res) =>{
    try{
        // const active = await getActive();
        const sql = `SELECT * FROM buildingkind`; // should have active at some point
        const [result] = await pool.query(sql, []);

        res.json({ success: true, message: "Success in fetching List", data: result});

    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});



router.get('/mtList', async (req, res) =>{
    try{
        // const active = await getActive();
        const sql = `SELECT * FROM machinerytype`; // should have active at some point
        const [result] = await pool.query(sql, []);

        res.json({ success: true, message: "Success in fetching List", data: result});

    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});

router.post('/mtAdd', async (req, res) => {
    try{
        const { code, name, description } = req.body;
        const sql = `INSERT INTO machinerytype(code, name, description) VALUES (?, ?, ?)`;
        await pool.query(sql, [code, name, description]);
        res.json({success: true, message: "Machine Type Created Successfully!"});
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
})

router.get('/mtGet', async (req, res) => {
    try{
        const { mt_id } = req.query;
        const sql = `SELECT * FROM machinerytype WHERE mt_id = ?`;
        const [result] = await pool.query(sql, [mt_id]);
        res.json({success: true, message: "Data loaded successfully!", data: result[0]});
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});

router.put('/mtSet', async (req, res) => {
    try{
        const { mt_id, code, name, description } = req.body;
        const sql = `
            UPDATE machinerytype
            SET code = ?, name = ?, description = ?
            WHERE mt_id = ?
            `; // should have active at some point
        const [result] = await pool.query(sql, [code, name, description, mt_id]);
        res.json({ success: true, message: "Success in Updating Building Kind"});
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});

router.delete('/mtDel', async (req, res)=> {
    try{
        const { mt_id } = req.query;
        const sql = `
            DELETE FROM machinerytype WHERE mt_id = ?
            `; // should have active at some point
        await pool.query(sql, [mt_id]);
        res.json({ success: true, message: "Success in Deleting Building Kind"});
    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});




router.get('/bauList', async (req, res) =>{
    try{
        const active = await getActive();
        const sql = `SELECT * FROM buildingactualuse WHERE ry_id = ?`;
        const [result] = await pool.query(sql, [active]);

        res.json({ success: true, message: "Success in fetching List", data: result});

    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});

router.get('/mauList', async (req, res) =>{
    try{
        const active = await getActive();
        const sql = `SELECT * FROM machineryactualuse WHERE ry_id = ?`;
        const [result] = await pool.query(sql, [active]);

        res.json({ success: true, message: "Success in fetching List", data: result});

    }catch(err){
        console.error(err);
        res.status(500).json({success: false, message: "Internal Server Error!"});
    }
});

export default router;