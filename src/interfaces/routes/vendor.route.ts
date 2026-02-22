import { Router } from "express";
import { z } from "zod";
import { pool } from "../../infrastructure/database";
import { AppError } from "../../shared/errors";
import { prisma } from "../../infrastructure/prisma";

const router = Router();

const createVendorSchema = z.object({
  name: z.string().min(2, "name must be at least 2 characters"),
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = createVendorSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, parsed.error.message);

    const { name } = parsed.data;

    const vendor = await prisma.vendor.create({
      data: { name },
    });

    res.json(vendor);
  } catch (e) {
    next(e);
  }
});

export default router;