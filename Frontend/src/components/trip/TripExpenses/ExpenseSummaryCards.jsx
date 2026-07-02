import {
  Wallet,
  CreditCard,
  PiggyBank,
  Users,
  TrendingUp,
} from "lucide-react";

import "./ExpenseSummaryCards.css";

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function ExpenseSummaryCards({ summary }) {
  if (!summary) return null;

  const {
    budget = 0,
    totalSpent = 0,
    remaining = 0,
    totalPeople = 0,
    costPerPerson = 0,
    budgetStatus = "safe",
  } = summary;

  const cards = [
    {
      title: "Trip Budget",
      value: formatCurrency(budget),
      icon: Wallet,
      color: "blue",
    },
    {
      title: "Total Spent",
      value: formatCurrency(totalSpent),
      icon: CreditCard,
      color: "red",
    },
    {
      title: "Remaining",
      value: formatCurrency(remaining),
      icon: PiggyBank,
      color: remaining >= 0 ? "green" : "red",
    },
    {
      title: "Members",
      value: totalPeople,
      icon: Users,
      color: "purple",
    },
    {
      title: "Per Person",
      value: formatCurrency(costPerPerson),
      icon: TrendingUp,
      color: "orange",
    },
  ];

  return (
    <section className="summary-section">
      <div className="summary-header">
        <div>
          <h2>Finance Overview</h2>
          <p>
            Real-time overview of your trip budget and expenses.
          </p>
        </div>

        <span className={`budget-status ${budgetStatus}`}>
          {budgetStatus.replace("_", " ")}
        </span>
      </div>

      <div className="summary-grid">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className={`summary-card ${card.color}`}
            >
              <div className="summary-icon">
                <Icon size={24} />
              </div>

              <div className="summary-content">
                <span>{card.title}</span>

                <h3>{card.value}</h3>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}