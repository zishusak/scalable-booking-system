import { Router } from "express";
import { BookingController } from "../controllers/booking.controller";

const router = Router();
const controller = new BookingController();

router.post("/", (req, res, next) => controller.create(req, res, next));
router.get("/", (req, res, next) => controller.list(req, res, next));

export default router;