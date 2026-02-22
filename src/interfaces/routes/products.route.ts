import { Router } from "express";
import { prisma } from "../../infrastructure/prisma";
import { z } from "zod";
import { AppError } from "../../shared/errors";

const router = Router();

const schema = z.object({
  vendorId: z.number(),
  name: z.string().min(2),
  price: z.number().positive(),
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, parsed.error.message);

    const { vendorId, name, price } = parsed.data;

    const product = await prisma.product.create({
      data: { vendorId, name, price },
    });

    res.json(product);
  } catch (e) {
    next(e);
  }
});

export default router;