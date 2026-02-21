import { Pool } from "pg";

export const pool = new Pool({
  user: "booking_user",
  host: "localhost",
  database: "booking_db",
  password: "booking_pass",
  port: 5433,
});