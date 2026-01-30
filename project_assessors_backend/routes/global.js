import express from "express";
import pool from "../db.js";

const router = express.Router();
const ry = "RevisionYear";

// these are for internal backend access only, for management

export const getActive = async () => {
    const sql = `SELECT ry_id FROM ${ry} WHERE active = 1`;
    const [active] = await pool.query(sql, {});
    return active[0].ry_id;
}


