/**
 * Expense Settlement Flow
 *
 * Expenses
 *   ↓
 * Balances (per member, based on who paid vs who owes)
 *   ↓
 * Creditors / Debtors (split by sign of balance)
 *   ↓
 * Optimized Transactions (minimum transfers to settle everyone)
 */

import Expense from "../Models/Expense.js";
import TripMember from "../Models/TripMember.js";

const round = (num) => Math.round(num * 100) / 100;

/**
 * Build an initial balance map with an entry for every valid trip member.
 * Members with a null userId are skipped since they cannot be settled.
 */
const initializeBalances = (members) => {
  const balances = {};

  members.forEach((member) => {
    if (!member.userId || !member.userId._id) return;

    const userId = member.userId._id.toString();

    balances[userId] = {
      userId,
      name: member.userId.name,
      email: member.userId.email,
      balance: 0
    };
  });

  return balances;
};

/**
 * Resolve the per-participant shares for a single expense.
 * - "equal" splits divide the amount evenly across splitAmong participants.
 *   Since equal division of currency doesn't always divide cleanly, every
 *   participant gets the same rounded share except the last, who absorbs
 *   the leftover remainder. This guarantees the shares sum exactly to the
 *   expense amount instead of drifting by a cent due to rounding.
 * - All other split types must have explicit amounts that sum to the
 *   expense total; mismatches are treated as a data integrity error.
 */
const resolveShares = (expense) => {
  const participants = Array.isArray(expense.splitAmong) ? expense.splitAmong : [];
  if (participants.length === 0) return [];

  if (expense.splitType === "equal") {
    const equalShare = round(expense.amount / participants.length);
    const shares = participants.map(() => equalShare);

    const allocated = round(equalShare * (participants.length - 1));
    shares[shares.length - 1] = round(expense.amount - allocated);

    return participants.map((split, index) => ({
      userId: split.userId,
      amount: shares[index]
    }));
  }

  const total = round(
    participants.reduce((sum, split) => sum + (split.amount || 0), 0)
  );

  if (Math.abs(total - expense.amount) > 0.01) {
    throw new Error(
      `Expense ${expense._id}: splitAmong total (${total}) does not match expense amount (${expense.amount})`
    );
  }

  return participants.map((split) => ({
    userId: split.userId,
    amount: split.amount
  }));
};

/**
 * Apply every expense to the balance map.
 * The payer's balance increases by the full amount paid.
 * Each participant's balance decreases by their resolved share.
 * Values are kept as raw floating point numbers here and only rounded
 * once, after all calculations are complete, to avoid compounding
 * rounding errors across many expenses.
 */
const calculateBalances = (balances, expenses) => {
  expenses.forEach((expense) => {
    const shares = resolveShares(expense);
    if (shares.length === 0) return;

    const payerId = expense.paidBy?.toString();
    if (payerId && balances[payerId]) {
      balances[payerId].balance += expense.amount;
    }

    shares.forEach((share) => {
      const participantId = share.userId?.toString();
      if (participantId && balances[participantId]) {
        balances[participantId].balance -= share.amount;
      }
    });
  });

  Object.values(balances).forEach((entry) => {
    entry.balance = round(entry.balance);
  });

  return balances;
};

/**
 * Split members into creditors (owed money) and debtors (owe money),
 * ignoring balances that are effectively zero.
 */
const splitCreditorsAndDebtors = (balanceList) => {
  const creditors = [];
  const debtors = [];

  balanceList.forEach(({ userId, name, balance }) => {
    if (Math.abs(balance) <= 0.01) return;

    if (balance > 0) {
      creditors.push({ userId, name, amount: balance });
    } else {
      debtors.push({ userId, name, amount: Math.abs(balance) });
    }
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  return { creditors, debtors };
};

/**
 * Greedily match the largest debtor against the largest creditor,
 * repeatedly settling the smaller of the two amounts. This produces
 * a near-minimal number of transactions without needing an exhaustive
 * search over all possible pairings.
 *
 * NOTE: this mutates the `amount` field on the creditors/debtors it
 * receives, reducing each toward zero as settlements are recorded.
 * Callers that need the pre-settlement totals must capture them
 * BEFORE calling this function.
 */
const optimizeSettlements = (creditors, debtors) => {
  const settlements = [];

  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];

    const amount = round(Math.min(creditor.amount, debtor.amount));

    if (amount > 0) {
      settlements.push({
        from: debtor.userId,
        fromName: debtor.name,
        to: creditor.userId,
        toName: creditor.name,
        amount
      });
    }

    creditor.amount = round(creditor.amount - amount);
    debtor.amount = round(debtor.amount - amount);

    if (creditor.amount <= 0.01) creditorIndex += 1;
    if (debtor.amount <= 0.01) debtorIndex += 1;
  }

  return settlements;
};

export const calculateSettlements = async (tripId) => {
  const expenses = await Expense.find({ tripId });

  const members = await TripMember.find({
    tripId,
    userId: { $ne: null }
  }).populate("userId", "name email");

  const balances = initializeBalances(members);
  calculateBalances(balances, expenses);

  const balanceList = Object.values(balances);

  const { creditors, debtors } = splitCreditorsAndDebtors(balanceList);

  // Capture totals BEFORE optimizeSettlements mutates these arrays,
  // otherwise creditor/debtor amounts will have been driven to ~0.
  const totalCredit = round(creditors.reduce((sum, c) => sum + c.amount, 0));
  const totalDebt = round(debtors.reduce((sum, d) => sum + d.amount, 0));

  const settlements = optimizeSettlements(creditors, debtors);

  return {
    balances: balanceList,
    settlements,
    transactionCount: settlements.length,
    totalCredit,
    totalDebt
  };
};