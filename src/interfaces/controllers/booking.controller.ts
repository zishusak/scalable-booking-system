import { Request, Response, NextFunction } from "express";
import { BookingService } from "../../application/services/booking.service";
import { AppError } from "../../shared/errors";

const bookingService = new BookingService();

export class BookingController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = Number(req.body?.productId);
      const quantity = Number(req.body?.quantity);

      if (Number.isNaN(productId) || Number.isNaN(quantity)) {
        throw new AppError(400, "productId and quantity must be numbers");
      }

      const idempotencyKey = (req.headers["idempotency-key"] as string | undefined) ?? "";

      const result = await bookingService.createBooking({
        productId,
        quantity,
        idempotencyKey,
      });

      return res.status(result.status).json(result.data);
    } catch (e) {
      next(e);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await bookingService.listBookings();
      res.json(data);
    } catch (e) {
      next(e);
    }
  }
}