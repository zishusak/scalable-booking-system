import crypto from "crypto";
import { prisma } from "../../infrastructure/prisma";
import { AppError } from "../../shared/errors";

type CreateBookingInput = {
  productId: number;
  quantity: number;
  idempotencyKey: string;
};

function hashBody(body: any) {
  return crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");
}

export class BookingService {
  async createBooking(input: CreateBookingInput) {
    const { productId, quantity, idempotencyKey } = input;

    if (!idempotencyKey) throw new AppError(400, "Idempotency-Key header is required");

    const requestHash = hashBody({ productId, quantity });

    // 1) Check existing idempotency key
    const existing = await prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
    });

    if (existing) {
      // Expired? ignore and recreate
      if (existing.expiresAt < new Date()) {
        await prisma.idempotencyKey.delete({ where: { key: idempotencyKey } }).catch(() => {});
      } else {
        // Same key must map to same payload
        if (existing.requestHash !== requestHash) {
          throw new AppError(409, "Idempotency-Key conflict: request payload differs");
        }
        return { status: 200 as const, data: existing.response };
      }
    }

    // 2) Create booking with atomic stock decrement in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.updateMany({
        where: { id: productId, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      });

      if (updated.count === 0) {
        const exists = await tx.product.findUnique({
          where: { id: productId },
          select: { id: true },
        });

        if (!exists) throw new AppError(404, "Product not found");
        throw new AppError(400, "Insufficient stock");
      }

      return tx.booking.create({
        data: { productId, quantity },
      });
    });

    // 3) Store idempotency response (24h TTL)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        requestHash,
        response: booking as any,
        expiresAt,
      },
    });

    return { status: 201 as const, data: booking };
  }

  async listBookings() {
    const bookings = await prisma.booking.findMany({
      orderBy: { id: "desc" },
      include: {
        product: { include: { vendor: true } },
      },
    });

    return bookings;
  }
}