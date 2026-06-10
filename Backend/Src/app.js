import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import tripRoutes from './routes/trip.routes.js';

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TripMitra API Running"
  });
});

app.use("/api/auth", authRoutes);
app.use('/api/trips',tripRoutes);
export default app;