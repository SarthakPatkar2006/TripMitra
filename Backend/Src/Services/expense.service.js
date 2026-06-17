import Expense from "../Models/Expense.js";
import TripMember from "../Models/TripMember.js";
import User from "../Models/User.js";
export const calculateSettlements = async (tripId) => {
  const expenses = await Expense.find({ tripId });
  const members = await TripMember.find({
    tripId,
    status: "accepted",
    userId: { $ne: null }
  });

  const balances = {};

  members.forEach((member) => {
    balances[member.userId.toString()] = 0;
  });

  expenses.forEach((expense) => {
    const payer = expense.paidBy.toString();

    if (balances[payer] !== undefined) {
      balances[payer] += expense.amount;
    }

    expense.splitBetween.forEach((split) => {
      const debtor = split.userId.toString();

      if (balances[debtor] !== undefined) {
        balances[debtor] -= split.share;
      }
    });
  });

  const debtors = [];
  const creditors = [];

  Object.entries(balances).forEach(([userId, rawBalance]) => {
    const balance = Number(rawBalance.toFixed(2));

    if (Math.abs(balance) <= 0.01) {
      return;
    }

    if (balance < 0) {
      debtors.push({ userId, amount: Math.abs(balance) });
    } else {
      creditors.push({ userId, amount: balance });
    }
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.amount, creditor.amount);

    settlements.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: Number(amount.toFixed(2))
    });

    debtor.amount = Number((debtor.amount - amount).toFixed(2));
    creditor.amount = Number((creditor.amount - amount).toFixed(2));

    if (debtor.amount <= 0.01) debtorIndex += 1;
    if (creditor.amount <= 0.01) creditorIndex += 1;
  }
const balanceCards = [];

for (const [userId, amount]
of Object.entries(balances)) {

  const user =
    await User.findById(
      userId
    );

  balanceCards.push({
    userId,
    name:
      user?.name ||
      "Unknown",
    amount:
      Number(
        amount.toFixed(2)
      )
  });
}

return {
  balances:
    balanceCards,
  settlements
};
  return {
    balances,
    settlements
  };
};
