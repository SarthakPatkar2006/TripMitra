import express from "express";
import cors from "cors";

// 1. Import all your feature routes
import authRoutes from "./routes/auth.routes.js";
import tripRoutes from './routes/trip.routes.js';
import invitationRoutes from "./routes/invitation.routes.js";
import plannerRoutes from "./routes/planner.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import expenseRoutes from "./routes/expense.routes.js"; 
import notificationRoutes from "./routes/notification.routes.js"; 

const app = express();

// 2. Global Middleware
app.use(cors()); // Allows your React app on port 3000 to talk to port 5000
app.use(express.json()); // Allows Express to read req.body JSON data

// 3. Health Check Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TripMitra API is fully operational 🚀"
  });
});

// 4. Mount the API Routes
app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/planner", plannerRoutes); 
app.use("/api/activities", activityRoutes);
app.use("/api/expenses", expenseRoutes); 
app.use("/api/notifications", notificationRoutes); 

// 5. Global Error Handler (Safety net for crashing routes)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: "Something broke on the server!" });
});

export default app;