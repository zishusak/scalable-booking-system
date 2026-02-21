import { Router } from "express";
import { z } from "zod";
import { pool } from "../../infrastructure/database";
import { AppError } from "../../shared/errors";

const router = Router();

const createVendorSchema = z.object({
  name: z.string().min(2, "name must be at least 2 characters"),
  price:z.number("price must be number and filled"),
  vendor_id:z.number("vendor id must be assigned")
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = createVendorSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, parsed.error.message);

    const { vendor_id, name, price } = parsed.data;

    const result = await pool.query(
     "INSERT INTO products (vendor_id, name, price) VALUES ($1, $2, $3) RETURNING *",
     [vendor_id,name,price]
    );

    res.json(result.rows[0]);
  } catch (e) {
    next(e);
  }
});

export default router;