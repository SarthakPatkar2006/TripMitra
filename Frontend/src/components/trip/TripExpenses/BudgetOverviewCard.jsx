import { useMemo } from "react";
import {
  Wallet,
  CreditCard,
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

import "./BudgetOverviewCard.css";

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function BudgetOverviewCard({
  budget = 0,
  spent = 0,
  remaining = 0,
  percent = 0,
  status = "safe",
}) {
  const statusData = useMemo(() => {
    switch (status) {
      case "over_budget":
        return {
          title: "Over Budget",
          message:
            "You've exceeded the allocated trip budget. Consider reducing future expenses.",
          icon: AlertTriangle,
          className: "danger",
        };

      case "near_limit":
        return {
          title: "Budget Warning",
          message:
            "You're approaching your trip budget. Spend carefully for the remaining days.",
          icon: TrendingUp,
          className: "warning",
        };

      default:
        return {
          title: "Budget Healthy",
          message:
            "Great! Your expenses are currently well within the allocated budget.",
          icon: CheckCircle2,
          className: "success",
        };
    }
  }, [status]);

  const StatusIcon = statusData.icon;

  return (
    <section className="budget-card">
      <div className="budget-card-header">
        <div>
          <h2>Budget Overview</h2>
          <p>Track your trip spending in real time.</p>
        </div>

        <div className={`budget-chip ${statusData.className}`}>
          <StatusIcon size={16} />
          {statusData.title}
        </div>
      </div>

      <div className="budget-stats">
        <div className="budget-stat">
          <div className="budget-icon blue">
            <Wallet size={22} />
          </div>

          <div>
            <span>Total Budget</span>
            <h3>{formatCurrency(budget)}</h3>
          </div>
        </div>

        <div className="budget-stat">
          <div className="budget-icon red">
            <CreditCard size={22} />
          </div>

          <div>
            <span>Total Spent</span>
            <h3>{formatCurrency(spent)}</h3>
          </div>
        </div>

        <div className="budget-stat">
          <div className="budget-icon green">
            <PiggyBank size={22} />
          </div>

          <div>
            <span>Remaining</span>
            <h3>{formatCurrency(remaining)}</h3>
          </div>
        </div>
      </div>

      <div className="progress-wrapper">
        <div className="progress-label">
          <span>Budget Usage</span>
          <strong>{Math.round(percent)}%</strong>
        </div>

        <div className="progress-track">
          <div
            className={`progress-fill ${statusData.className}`}
            style={{
              width: `${Math.min(percent, 100)}%`,
            }}
          />
        </div>
      </div>

      <div className={`budget-message ${statusData.className}`}>
        <StatusIcon size={18} />

        <div>
          <strong>{statusData.title}</strong>
          <p>{statusData.message}</p>
        </div>
      </div>
    </section>
  );
}