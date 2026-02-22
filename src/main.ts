import express from "express";
import "dotenv/config";
import { pool } from "./infrastructure/database";
import vendorRoutes from "./interfaces/routes/vendor.route";
import productRoutes from "./interfaces/routes/products.route"
import bookingRoutes from "./interfaces/routes/booking.route";
import { errorMiddleware } from "./interfaces/middlewares/error.middleware";
// ... routes above


pool.connect()
  .then(() => console.log("Database connected"))
  .catch(err => console.error("DB connection error", err));

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});
app.use("/vendors", vendorRoutes);

app.use("/products",productRoutes);

app.use("/bookings", bookingRoutes);

app.use(errorMiddleware);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});