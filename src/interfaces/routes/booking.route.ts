import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "../../infrastructure/prisma";
import { AppError } from "../../shared/errors";

function hashBody(body: any) {
  return crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");
}

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

    const idempotencyKey = req.header("Idempotency-Key");
    if (!idempotencyKey) throw new AppError(400, "Idempotency-Key header is required");

    const requestHash = hashBody({ productId, quantity });

    const existing = await prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
    });

    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new AppError(409, "Idempotency-Key conflict: request payload differs");
      }
      return res.status(200).json(existing.response);
    }

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

        await prisma.idempotencyKey.create({
            data: {
              key: idempotencyKey,
              requestHash,
              response: booking as any,
            },
        });


    res.status(201).json(booking);
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { id: "asc" },
      include: {
        product: {
          include: { vendor: true },
        },
      },
    });
    res.json(bookings);
  } catch (e) {
    next(e);
  }
});

export default router;