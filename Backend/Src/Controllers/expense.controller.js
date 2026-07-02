import mongoose from "mongoose";
import Expense from "../Models/Expense.js";
import Trip from "../Models/Trip.js";
import TripMember from "../Models/TripMember.js";
import Notification from "../Models/Notification.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const round = (num) => Math.round(num * 100) / 100;

/**
 * Fetch every valid userId associated with a trip: TripMember entries
 * plus the trip owner, who may or may not also exist as a TripMember.
 * Used to validate paidBy / splitAmong references and to build
 * notification recipient lists.
 */
const getTripMemberIds = async (tripId) => {
  const [trip, members] = await Promise.all([
    Trip.findById(tripId).select("owner").lean(),
    TripMember.find({ tripId, userId: { $ne: null } }).select("userId").lean()
  ]);

  const ids = new Set(members.map((m) => m.userId.toString()));

  if (trip?.owner) {
    ids.add(trip.owner.toString());
  }

  return ids;
};

/**
 * Validate the core expense payload shared by addExpense and updateExpense.
 * Returns an error message string, or null if valid.
 */
const validateExpensePayload = ({
  title,
  amount,
  paidBy,
  splitType,
  splitAmong,
  memberIds
}) => {
  if (!title || !title.trim()) {
    return "Title is required";
  }

  if (typeof amount !== "number" || amount <= 0) {
    return "Amount must be a positive number";
  }

  if (!paidBy || !isValidId(paidBy)) {
    return "A valid paidBy user is required";
  }

  if (!memberIds.has(paidBy.toString())) {
    return "paidBy must be a member of this trip";
  }

  if (!Array.isArray(splitAmong)) {
    return "splitAmong must be an array";
  }

  const participants = splitAmong.filter(
    (split) => Number(split.amount) > 0
  );

  if (participants.length === 0) {
    return "Select at least one participant";
  }

  for (const split of participants) {
    if (!split.userId || !isValidId(split.userId)) {
      return "Every participant requires a valid userId";
    }

    if (!memberIds.has(split.userId.toString())) {
      return "Participant must belong to this trip";
    }
  }

  if (splitType === "custom") {
    const total = round(
      participants.reduce(
        (sum, split) => sum + Number(split.amount),
        0
      )
    );

    if (Math.abs(total - amount) > 0.01) {
      return "Participant amounts must equal expense amount";
    }
  } else if (splitType !== "equal") {
    return "splitType must be 'equal' or 'custom'";
  }

  return null;
};

const populateExpenseQuery = (query) =>
  query
    .populate("paidBy", "name email")
    .populate("createdBy", "name email")
    .populate("splitAmong.userId", "name email");

/**
 * Notify every trip member except the acting user.
 * NOTE: this assumes the Notification model's `type` enum includes
 * "expense_added", "expense_updated", and "expense_deleted". If the
 * schema only defines "expense_added" / "expense_settled" today,
 * extend the enum first or these inserts will throw a validation error.
 */
const notifyTripMembers = async ({ tripId, memberIds, currentUserId, type, message }) => {
  const recipientIds = [...memberIds].filter((id) => id !== currentUserId.toString());

  if (recipientIds.length === 0) return;

  await Notification.insertMany(
    recipientIds.map((userId) => ({
      userId,
      type,
      message,
      tripId
    }))
  );
};

export const addExpense = async (req, res) => {
  try {
    const { tripId } = req.params;

    if (!isValidId(tripId)) {
      return res.status(400).json({ success: false, message: "Invalid Request" });
    }

    const {
      title,
      description,
      category,
      amount,
      paidBy,
      splitType,
      expenseDate
    } = req.body;

    // let, not const: equal-split recompute below reassigns this.
    let { splitAmong } = req.body;

    const [trip, memberIds] = await Promise.all([
      Trip.findById(tripId).lean(),
      getTripMemberIds(tripId)
    ]);

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const validationError = validateExpensePayload({
      title,
      amount,
      paidBy,
      splitType,
      splitAmong,
      memberIds
    });

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    // Fix 4: backend is authoritative for equal splits — recompute here
    // rather than trusting whatever amounts the client sent.
    if (splitType === "equal") {
      const share = round(amount / splitAmong.length);

      splitAmong = splitAmong.map((split) => ({
        userId: split.userId,
        amount: share
      }));
    }

    // Fix 2: only persist participants with a positive share.
    const participants = splitAmong.filter(
      (split) => Number(split.amount) > 0
    );

    const expense = await Expense.create({
      tripId,
      title,
      description,
      category,
      amount,
      paidBy,
      splitType,
      splitAmong: participants,
      expenseDate,
      createdBy: req.user._id
    });

    const populatedExpense = await populateExpenseQuery(Expense.findById(expense._id));

    await notifyTripMembers({
      tripId,
      memberIds,
      currentUserId: req.user._id,
      type: "expense_added",
      message: `${req.user.name} added ${title} expense (₹${amount}).`
    });

    res.status(201).json({
      success: true,
      expense: populatedExpense
    });
  } catch (error) {
    console.error("Add expense error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getExpenses = async (req, res) => {
  try {
    const { tripId } = req.params;

    if (!isValidId(tripId)) {
      return res.status(400).json({ success: false, message: "Invalid Request" });
    }

    const { category, paidBy } = req.query;

    const filter = { tripId };
    if (category) filter.category = category;
    if (paidBy) {
      if (!isValidId(paidBy)) {
        return res.status(400).json({ success: false, message: "Invalid Request" });
      }
      filter.paidBy = paidBy;
    }

    const expenses = await populateExpenseQuery(Expense.find(filter))
      .sort({ expenseDate: -1 })
      .lean();

    res.status(200).json({
      success: true,
      expenses
    });
  } catch (error) {
    console.error("Get expenses error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;

    if (!isValidId(expenseId)) {
      return res.status(400).json({ success: false, message: "Invalid Request" });
    }

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    const [trip, memberIds] = await Promise.all([
      Trip.findById(expense.tripId).lean(),
      getTripMemberIds(expense.tripId)
    ]);

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const isOwner = trip.owner.toString() === req.user._id.toString();
    const isCreator = expense.createdBy.toString() === req.user._id.toString();

    if (!isOwner && !isCreator) {
      return res.status(403).json({ success: false, message: "Permission denied" });
    }

    const {
      title,
      description,
      category,
      amount,
      paidBy,
      splitType,
      expenseDate
    } = req.body;

    // let, not const: equal-split recompute below may reassign this.
    let { splitAmong } = req.body;

    const validationError = validateExpensePayload({
      title: title ?? expense.title,
      amount: amount ?? expense.amount,
      paidBy: paidBy ?? expense.paidBy,
      splitType: splitType ?? expense.splitType,
      splitAmong: splitAmong ?? expense.splitAmong,
      memberIds
    });

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const effectiveSplitType = splitType ?? expense.splitType;
    const effectiveAmount = amount ?? expense.amount;

    // Fix 4: recompute equal splits server-side whenever a new
    // splitAmong array is actually provided for an equal-split expense.
    if (splitAmong && effectiveSplitType === "equal") {
      const share = round(effectiveAmount / splitAmong.length);

      splitAmong = splitAmong.map((split) => ({
        userId: split.userId,
        amount: share
      }));
    }

    expense.title = title ?? expense.title;
    expense.description = description ?? expense.description;
    expense.category = category ?? expense.category;
    expense.amount = amount ?? expense.amount;
    expense.paidBy = paidBy ?? expense.paidBy;
    expense.splitType = splitType ?? expense.splitType;

    // Fix 3: only persist participants with a positive share.
    expense.splitAmong = splitAmong
      ? splitAmong.filter((split) => Number(split.amount) > 0)
      : expense.splitAmong;

    expense.expenseDate = expenseDate ?? expense.expenseDate;

    await expense.save();

    const populatedExpense = await populateExpenseQuery(Expense.findById(expense._id));

    await notifyTripMembers({
      tripId: expense.tripId,
      memberIds,
      currentUserId: req.user._id,
      type: "expense_updated",
      message: `${req.user.name} updated ${expense.title} expense (₹${expense.amount}).`
    });

    res.status(200).json({
      success: true,
      expense: populatedExpense
    });
  } catch (error) {
    console.error("Update expense error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;

    if (!isValidId(expenseId)) {
      return res.status(400).json({ success: false, message: "Invalid Request" });
    }

    const expense = await Expense.findById(expenseId).lean();

    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    const [trip, memberIds] = await Promise.all([
      Trip.findById(expense.tripId).lean(),
      getTripMemberIds(expense.tripId)
    ]);

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const isOwner = trip.owner.toString() === req.user._id.toString();
    const isCreator = expense.createdBy.toString() === req.user._id.toString();

    if (!isOwner && !isCreator) {
      return res.status(403).json({ success: false, message: "Permission denied" });
    }

    await Expense.findByIdAndDelete(expenseId);

    await notifyTripMembers({
      tripId: expense.tripId,
      memberIds,
      currentUserId: req.user._id,
      type: "expense_deleted",
      message: `${expense.title} expense deleted.`
    });

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully."
    });
  } catch (error) {
    console.error("Delete expense error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};