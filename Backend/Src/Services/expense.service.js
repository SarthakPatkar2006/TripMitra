import Expense from "../Models/Expense.js";
import TripMember from "../Models/TripMember.js"; // Assuming you track members here

export const calculateSettlements = async (tripId) => {
    // 1. Fetch all expenses for this trip
    const expenses = await Expense.find({ tripId });
    
    // 2. Fetch all members of this trip to initialize balances to 0
    const members = await TripMember.find({ tripId });
    
    // Map to keep track of everyone's net balance: { userId: netBalance }
    const balances = {};
    members.forEach(member => {
        balances[member.userId.toString()] = 0;
    });

    // 3. Calculate Net Balances
    // Net Balance = (What you paid) - (What you owe)
    expenses.forEach(expense => {
        const payer = expense.paidBy.toString();
        
        // Add total amount to the person who paid
        if (balances[payer] !== undefined) {
            balances[payer] += expense.amount;
        }

        // Subtract each person's shared allocation
        expense.splitBetween.forEach(split => {
            const debtor = split.userId.toString();
            if (balances[debtor] !== undefined) {
                balances[debtor] -= split.share;
            }
        });
    });

    // 4. Separate into Debtors (negative balance) and Creditors (positive balance)
    let debtors = [];
    let creditors = [];

    Object.keys(balances).forEach(userId => {
        const balance = balances[userId];
        // Rounding up small JS float inaccuracies
        if (Math.abs(balance) > 0.01) {
            if (balance < 0) {
                debtors.push({ userId, amount: Math.abs(balance) });
            } else {
                creditors.push({ userId, amount: balance });
            }
        }
    });

    // 5. The Greedy Matching Algorithm (Minimizes transactions)
    const settlements = [];

    // Sort descending so we always match the biggest debts first
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let d = 0;
    let c = 0;

    while (d < debtors.length && c < creditors.length) {
        let debtor = debtors[d];
        let creditor = creditors[c];

        // Find out the maximum amount that can be settled right now
        let settleAmount = Math.min(debtor.amount, creditor.amount);

        settlements.push({
            from: debtor.userId,
            to: creditor.userId,
            amount: Number(settleAmount.toFixed(2))
        });

        // Deduct the settled amount from both parties
        debtor.amount -= settleAmount;
        creditor.amount -= settleAmount;

        // Move pointers forward if a balance hits 0
        if (debtor.amount < 0.01) d++;
        if (creditor.amount < 0.01) c++;
    }

    return {
        balances,
        settlements
    };
};