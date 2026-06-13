import { Router } from "express";
import { 
  createExpense, 
  getTripExpenses, 
  getTripSettlements 
} from "../Controllers/expense.controller.js";
import { protect } from "../Middlewares/auth.middleware.js";

const router = Router();

// All expense actions require a logged-in user
router.post("/log", protect, createExpense);
router.get("/trip/:tripId", protect, getTripExpenses);
router.get("/trip/:tripId/settlements", protect, getTripSettlements);

export default router;