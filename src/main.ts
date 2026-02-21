import express from "express";
import { pool } from "./infrastructure/database";
import vendorRoutes from "./interfaces/routes/vendor.route";
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

app.use(errorMiddleware);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});