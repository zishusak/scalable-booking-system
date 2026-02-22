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

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 10)));
    const skip = (page - 1) * limit;

    const vendorIdRaw = req.query.vendorId;
    const vendorId = vendorIdRaw ? Number(vendorIdRaw) : undefined;
    if (vendorIdRaw && Number.isNaN(vendorId)) throw new AppError(400, "vendorId must be a number");

    const where = vendorId ? { vendorId } : {};

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
        include: { vendor: true }, // ✅ relation
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items,
    });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/stock", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const stock = Number(req.body.stock);
    if (Number.isNaN(id) || Number.isNaN(stock)) throw new AppError(400, "id and stock must be numbers");

    const updated = await prisma.product.update({
      where: { id },
      data: { stock },
    });

    res.json(updated);
  } catch (e) {
    next(e);
  }
});

export default router;