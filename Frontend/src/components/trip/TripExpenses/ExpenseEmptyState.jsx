import { Receipt, Plus } from "lucide-react";
import "./ExpenseEmptyState.css";

export default function ExpenseEmptyState({
  onAddExpense,
}) {
  return (
    <section className="expense-empty">

      <div className="expense-empty-icon">
        <Receipt size={60} />
      </div>

      <h2>No Expenses Yet</h2>

      <p>
        Start tracking your trip expenses to
        monitor spending, generate analytics,
        and calculate settlements.
      </p>

      <button
        className="expense-empty-btn"
        onClick={onAddExpense}
      >
        <Plus size={18} />
        Add First Expense
      </button>

    </section>
  );
}