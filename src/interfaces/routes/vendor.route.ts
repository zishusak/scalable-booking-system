import { Router } from "express";
import { pool } from "../../infrastructure/database";

const router = Router();

router.post("/", async (req, res) => {
  const { name } = req.body;

  const result = await pool.query(
    "INSERT INTO vendors (name) VALUES ($1) RETURNING *",
    [name]
  );

  res.json(result.rows[0]);
});

export default router;