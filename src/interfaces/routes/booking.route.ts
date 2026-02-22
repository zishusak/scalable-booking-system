import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../infrastructure/prisma";
import { AppError } from "../../shared/errors";

const router = Router();

const schema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, parsed.error.message);

    const { productId, quantity } = parsed.data;

    // ✅ Transaction: check stock + decrement + create booking
    const booking = await prisma.$transaction(async (tx) => {
        // 1) atomic decrement only if stock is enough
        const updated = await tx.product.updateMany({
            where: {
            id: productId,
            stock: { gte: quantity },
            },
            data: {
            stock: { decrement: quantity },
            },
        });

        if (updated.count === 0) {
            // either product not found or insufficient stock
            const exists = await tx.product.findUnique({ where: { id: productId }, select: { id: true } });
            if (!exists) throw new AppError(404, "Product not found");
            throw new AppError(400, "Insufficient stock");
        }

        // 2) create booking
        return tx.booking.create({
            data: { productId, quantity },
        });
        });

    res.status(201).json(booking);
  } catch (e) {
    next(e);
  }
});

export default router;