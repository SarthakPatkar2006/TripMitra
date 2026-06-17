import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import tripRoutes from "./routes/trip.routes.js";
import invitationRoutes from "./routes/invitation.routes.js";
import plannerRoutes from "./routes/planner.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import itineraryRoutes from './routes/itinerary.routes.js';
import tripMemberRoutes from "./routes/tripMember.routes.js";
const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TripMitra API is operational"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/planner", plannerRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/itineraries",itineraryRoutes);
app.use("/api/trip-members",tripMemberRoutes);
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: "Something broke on the server"
  });
});

export default app;
